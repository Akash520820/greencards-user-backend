require("dotenv").config();
const app = require("./app");
const connectDB = require("./shared/db/index");
const logger = require("./shared/utils/logger");
const { startPoller } = require("./shared/workers/outboxPoller");
const startKeepAlive = require("./shared/utils/keepAlive");
const mongoose = require("mongoose");

// ─── Fail-fast: required env vars ────────────────────────────────────────────
const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
];
const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`[user-backend] Missing required environment variables: ${missing.join(", ")}`);
  console.error("Set them in your .env file (local) or Render Dashboard (production).");
  process.exit(1);
}

const PORT = process.env.PORT || process.env.USER_SERVICE_PORT || 5001;

connectDB()
  .then(() => {
    // ─── MongoDB reconnect handlers ───────────────────────────────────────────
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error (after startup):", err);
    });
    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected — Mongoose will auto-reconnect");
    });
    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    const server = app.listen(PORT, () => {
      logger.info(`👤 User Microservice running on port ${PORT}`);
      console.log(`👤 User Microservice running on port ${PORT}`);
    });

    // Start background outbox poller — delivers ORDER_CREATED events to seller-backend
    startPoller();
    // Start keep-alive self-pinging on Render
    startKeepAlive();

    // ─── Graceful shutdown ────────────────────────────────────────────────────
    // Finish in-flight requests before closing the MongoDB connection.
    // Render sends SIGTERM on deploy/restart; Ctrl-C sends SIGINT locally.
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info("HTTP server closed");
        mongoose.connection.close(false, () => {
          logger.info("MongoDB connection closed");
          process.exit(0);
        });
      });
      // Force-exit if graceful shutdown takes too long (e.g. stuck request)
      setTimeout(() => {
        logger.error("Graceful shutdown timed out — forcing exit");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
  })
  .catch((err) => {
    logger.error("MongoDB connection failed in User Microservice:", err);
    process.exit(1);
  });
