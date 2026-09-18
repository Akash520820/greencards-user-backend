const { Router } = require("express");
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  toggleHelpfulVote,
  reportReview,
} = require("../controllers/review.controller");
const { verifyJWT } = require("../shared/middleware/auth.middleware");
const upload = require("../shared/middleware/multer.middleware");
const validate = require("../shared/middleware/validate.middleware");
const {
  createReviewSchema,
  updateReviewSchema,
  reportReviewSchema,
  reviewIdParamSchema,
  productIdParamSchema,
} = require("../validators/review.validators");

const router = Router();

router.route("/product/:productId").get(validate({ params: productIdParamSchema }), getProductReviews); // public

router
  .route("/")
  .post(verifyJWT, upload.array("images", 5), validate({ body: createReviewSchema }), createReview);
router
  .route("/:reviewId")
  .patch(
    verifyJWT,
    upload.array("images", 5),
    validate({ params: reviewIdParamSchema, body: updateReviewSchema }),
    updateReview
  )
  .delete(verifyJWT, validate({ params: reviewIdParamSchema }), deleteReview);

router.route("/:reviewId/helpful").post(verifyJWT, validate({ params: reviewIdParamSchema }), toggleHelpfulVote);
router
  .route("/:reviewId/report")
  .post(verifyJWT, validate({ params: reviewIdParamSchema, body: reportReviewSchema }), reportReview);

module.exports = router;
