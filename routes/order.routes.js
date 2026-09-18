const { Router } = require("express");
const {
  createRazorpayOrder,
  placeOrder,
  razorpayWebhook,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  downloadOrderInvoice,
} = require("../controllers/order.controller");

const { verifyJWT, verifyAdmin } = require("../shared/middleware/auth.middleware");
const validate = require("../shared/middleware/validate.middleware");
const {
  buyNowOrCartSchema,
  placeOrderSchema,
  updateOrderStatusSchema,
  objectIdSchema,
} = require("../validators/order.validators");
const { z } = require("zod");

const { checkoutLimiter } = require("../shared/middleware/rateLimiter.middleware");

const router = Router();

router.route("/webhook").post(razorpayWebhook);

router.use(verifyJWT);

router.route("/razorpay").post(checkoutLimiter, validate({ body: buyNowOrCartSchema }), createRazorpayOrder);
router.route("/").post(checkoutLimiter, validate({ body: placeOrderSchema }), placeOrder).get(getMyOrders);

router.route("/:orderId").get(validate({ params: z.object({ orderId: objectIdSchema }) }), getOrderById);
router.route("/:orderId/invoice").get(validate({ params: z.object({ orderId: objectIdSchema }) }), downloadOrderInvoice);


router.route("/admin/all").get(verifyAdmin, getAllOrders);
router
  .route("/admin/:orderId/status")
  .patch(
    verifyAdmin,
    validate({ params: z.object({ orderId: objectIdSchema }), body: updateOrderStatusSchema }),
    updateOrderStatus
  );

module.exports = router;
