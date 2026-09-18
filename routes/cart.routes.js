const { Router } = require("express");
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require("../controllers/cart.controller");
const { verifyJWT } = require("../shared/middleware/auth.middleware");
const validate = require("../shared/middleware/validate.middleware");
const { addToCartSchema, updateCartItemSchema, itemIdParamSchema } = require("../validators/cart.validators");

const router = Router();

router.use(verifyJWT);

router.route("/").get(getCart).post(validate({ body: addToCartSchema }), addToCart).delete(clearCart);
router
  .route("/:itemId")
  .patch(validate({ params: itemIdParamSchema, body: updateCartItemSchema }), updateCartItem)
  .delete(validate({ params: itemIdParamSchema }), removeFromCart);

module.exports = router;
