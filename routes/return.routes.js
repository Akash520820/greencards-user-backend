const { Router } = require("express");
const {
  createReturn,
  getMyReturns,
  getReturnById,
  getAllReturns,
  reviewReturn,
  markPickedUp,
  processRefund,
} = require("../controllers/return.controller");
const { verifyJWT, verifyAdmin } = require("../shared/middleware/auth.middleware");
const validate = require("../shared/middleware/validate.middleware");
const {
  createReturnSchema,
  reviewReturnSchema,
  processRefundSchema,
  returnIdParamSchema,
} = require("../validators/return.validators");

const router = Router();

router.use(verifyJWT);

router.route("/").post(validate({ body: createReturnSchema }), createReturn).get(getMyReturns);
router.route("/:returnId").get(validate({ params: returnIdParamSchema }), getReturnById);

// admin only for now — swap verifyAdmin for a verifyDelivery middleware later if you add that role
router.route("/admin/all").get(verifyAdmin, getAllReturns);
router
  .route("/admin/:returnId/review")
  .patch(verifyAdmin, validate({ params: returnIdParamSchema, body: reviewReturnSchema }), reviewReturn);
router
  .route("/admin/:returnId/pickup")
  .patch(verifyAdmin, validate({ params: returnIdParamSchema }), markPickedUp);
router
  .route("/admin/:returnId/refund")
  .patch(verifyAdmin, validate({ params: returnIdParamSchema, body: processRefundSchema }), processRefund);

module.exports = router;
