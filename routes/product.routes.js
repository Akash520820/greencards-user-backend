const { Router } = require("express");
const {
  createProduct,
  getAllProducts,
  getProductBySlug,
  updateProduct,
  addColorVariantImages,   // <-- make sure this line exists
  deleteProduct,
  updateStock,
  getBestSellers,
  getFlashSaleProducts,
} = require("../controllers/product.controller");
const { verifyJWT, verifySellerOrAdmin } = require("../shared/middleware/auth.middleware");
const upload = require("../shared/middleware/multer.middleware");
const validate = require("../shared/middleware/validate.middleware");
const {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  addColorVariantImagesSchema,
  productIdParamSchema,
} = require("../validators/product.validators");

const router = Router();

// public routes
router.route("/").get(getAllProducts);
router.route("/bestsellers").get(getBestSellers);
router.route("/flash-sale").get(getFlashSaleProducts);
router.route("/:slug").get(getProductBySlug);

// admin or approved-seller routes — ownership of a specific product is enforced
// inside the controller (a seller can only touch products they created).
// NOTE: multer runs before validate() — it's what populates req.body on
// these multipart/form-data routes in the first place.
router
  .route("/")
  .post(
    verifyJWT,
    verifySellerOrAdmin,
    upload.array("images", 5),
    validate({ body: createProductSchema }),
    createProduct
  );
router
  .route("/:productId")
  .patch(
    verifyJWT,
    verifySellerOrAdmin,
    upload.array("images", 5),
    validate({ params: productIdParamSchema, body: updateProductSchema }),
    updateProduct
  )
  .delete(verifyJWT, verifySellerOrAdmin, validate({ params: productIdParamSchema }), deleteProduct);
router
  .route("/:productId/stock")
  .patch(
    verifyJWT,
    verifySellerOrAdmin,
    validate({ params: productIdParamSchema, body: updateStockSchema }),
    updateStock
  );
router
  .route("/:productId/color-images")
  .patch(
    verifyJWT,
    verifySellerOrAdmin,
    upload.array("images", 5),
    validate({ params: productIdParamSchema, body: addColorVariantImagesSchema }),
    addColorVariantImages
  );

module.exports = router;
