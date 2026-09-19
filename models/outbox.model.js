const mongoose = require("mongoose");

/**
 * Transactional Outbox — the guaranteed event relay between microservices.
 *
 * Pattern: When an operation must atomically trigger a cross-service event,
 * write the event here IN THE SAME TRANSACTION as the business operation.
 * A background poller (outboxPoller.js) picks up PENDING entries and delivers
 * them via HTTP to the target service, with retry on failure.
 *
 * This guarantees zero message loss even if the process crashes mid-operation,
 * because the event and the business data are always consistent with each other.
 */
const outboxSchema = new mongoose.Schema(
  {
    // What happened
    eventType: {
      type: String,
      required: true,
      enum: [
        "ORDER_CREATED",
        "ORDER_CANCELLED",
        "ORDER_PAID",
        "STOCK_RESERVED",
        "STOCK_FAILED",
        "RETURN_REQUESTED",
        "REFUND_ISSUED",
      ],
    },

    // The full payload the consumer needs to process this event
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Which service should receive and process this event
    targetService: {
      type: String,
      required: true,
      enum: ["user-backend", "seller-backend", "admin-backend", "superadmin-backend"],
    },

    // Delivery tracking
    status: {
      type: String,
      enum: ["PENDING", "PUBLISHED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    attempts:      { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    publishedAt:   { type: Date },
    errorMessage:  { type: String },
  },
  { timestamps: true }
);

// The outbox poller queries: { status: "PENDING" } sorted by createdAt ASC
// This compound index makes that query fast.
outboxSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("Outbox", outboxSchema);
