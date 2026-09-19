const Outbox = require("../../models/outbox.model");
const logger = require("../utils/logger");

// Internal service URLs — set in .env on Render
const SERVICE_URLS = {
  "seller-backend":     process.env.SELLER_BACKEND_INTERNAL_URL,
  "admin-backend":      process.env.ADMIN_BACKEND_INTERNAL_URL,
  "superadmin-backend": process.env.SUPERADMIN_BACKEND_INTERNAL_URL,
  "user-backend":       process.env.USER_BACKEND_INTERNAL_URL,
};

const MAX_ATTEMPTS = 5;

/**
 * Polls the outbox collection for PENDING events and delivers them via HTTP
 * to the target microservice. Retries up to MAX_ATTEMPTS times, then marks
 * as FAILED for manual intervention.
 *
 * Called on an interval from server.js — runs as long as the process is alive.
 */
const pollAndPublish = async () => {
  let events;
  try {
    events = await Outbox.find({ status: "PENDING" })
      .sort({ createdAt: 1 })
      .limit(50);
  } catch (err) {
    logger.error("Outbox poller: failed to query pending events", { error: err.message });
    return;
  }

  for (const event of events) {
    const targetUrl = SERVICE_URLS[event.targetService];
    if (!targetUrl) {
      logger.warn(`Outbox poller: no URL configured for target "${event.targetService}" — skipping event ${event._id}`);
      continue;
    }

    try {
      const response = await fetch(`${targetUrl}/internal/events`, {
        method:  "POST",
        headers: {
          "Content-Type":     "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET,
        },
        body:    JSON.stringify({ eventType: event.eventType, payload: event.payload }),
        signal:  AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Target responded with HTTP ${response.status}`);
      }

      await Outbox.findByIdAndUpdate(event._id, {
        status:      "PUBLISHED",
        publishedAt: new Date(),
      });

      logger.info(`Outbox: delivered ${event.eventType} → ${event.targetService}`);
    } catch (err) {
      const newAttempts = event.attempts + 1;
      const isFailed   = newAttempts >= MAX_ATTEMPTS;

      await Outbox.findByIdAndUpdate(event._id, {
        attempts:      newAttempts,
        lastAttemptAt: new Date(),
        errorMessage:  err.message,
        status:        isFailed ? "FAILED" : "PENDING",
      });

      if (isFailed) {
        logger.error(`Outbox: event ${event._id} (${event.eventType}) FAILED after ${MAX_ATTEMPTS} attempts — manual intervention required`, {
          error: err.message,
        });
      } else {
        logger.warn(`Outbox: delivery attempt ${newAttempts} failed for event ${event._id} — will retry`, {
          error: err.message,
        });
      }
    }
  }
};

// Start the polling loop — every 5 seconds
const startPoller = () => {
  logger.info("Outbox poller started — polling every 5s");
  // Run immediately on start, then on interval
  pollAndPublish();
  setInterval(pollAndPublish, 5_000);
};

module.exports = { startPoller, pollAndPublish };
