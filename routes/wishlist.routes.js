const { Router } = require("express");
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlist.controller");
const { verifyJWT } = require("../shared/middleware/auth.middleware");
const validate = require("../shared/middleware/validate.middleware");
const { addToWishlistSchema, wishlistProductIdParamSchema } = require("../validators/wishlist.validators");

const router = Router();

router.use(verifyJWT);

router.route("/").get(getWishlist).post(validate({ body: addToWishlistSchema }), addToWishlist);
router.route("/:productId").delete(validate({ params: wishlistProductIdParamSchema }), removeFromWishlist);

module.exports = router;
