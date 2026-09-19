const Order = require("../models/order.model");
const { logSecurityEvent } = require("../shared/utils/auditLog.util");
const logger = require("../shared/utils/logger");

/**
 * Internal event handler for user-backend.
 * Receives STOCK_RESERVED and STOCK_FAILED events from seller-backend's outbox poller.
 *
 * POST /internal/events
 * Header: x-internal-secret: <INTERNAL_API_SECRET>
 */
const handleIncomingEvent = async (req, res) => {
  const { eventType, payload } = req.body;

  logger.info(`User-backend internal event: ${eventType}`, { payload });

  // Acknowledge immediately
  res.status(200).json({ received: true });

  try {
    switch (eventType) {
      case "STOCK_RESERVED":
        await handleStockReserved(payload);
        break;
      case "STOCK_FAILED":
        await handleStockFailed(payload);
        break;
      default:
        logger.warn(`Unknown internal event type: ${eventType}`);
    }
  } catch (err) {
    logger.error(`Error processing internal event ${eventType}`, { error: err.message });
  }
};

/**
 * Stock reservation succeeded — mark the order as confirmed.
 */
const handleStockReserved = async (payload) => {
  const { orderId } = payload;
  await Order.findByIdAndUpdate(orderId, { orderStatus: "processing" });
  logger.info(`Saga: order ${orderId} stock confirmed — status set to processing`);
};

/**
 * Stock reservation failed (out of stock for one or more items).
 * Auto-cancel the order and trigger refund if payment was taken.
 */
const handleStockFailed = async (payload) => {
  const { orderId, failedItems } = payload;

  const order = await Order.findById(orderId);
  if (!order) {
    logger.warn(`STOCK_FAILED: order ${orderId} not found`);
    return;
  }

  if (order.orderStatus !== "processing") {
    // Already cancelled or delivered — skip
    return;
  }

  order.orderStatus = "cancelled";
  await order.save();

  // Log to audit trail
  await logSecurityEvent({
    action:       "ORDER_AUTO_CANCELLED",
    performedBy:  order.user.toString(),
    targetEntity: "order",
    targetId:     order.publicId || orderId,
    severity:     "WARNING",
    metadata:     { failedItems, reason: "Insufficient stock" },
  });

  logger.warn(`Saga: order ${orderId} auto-cancelled — insufficient stock`, { failedItems });

  // TODO: trigger Razorpay refund here if order.paymentStatus === "paid"
  // razorpayInstance.payments.refund(order.razorpayPaymentId, { amount: order.totalPrice * 100 })
};

module.exports = { handleIncomingEvent };
