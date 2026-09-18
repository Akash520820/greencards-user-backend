const { Router } = require("express");
const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/address.controller");
const { verifyJWT } = require("../shared/middleware/auth.middleware");
const validate = require("../shared/middleware/validate.middleware");
const {
  addAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} = require("../validators/address.validators");

const router = Router();

router.use(verifyJWT); // every address route requires login

router.route("/").post(validate({ body: addAddressSchema }), addAddress).get(getAddresses);
router
  .route("/:addressId")
  .patch(validate({ params: addressIdParamSchema, body: updateAddressSchema }), updateAddress)
  .delete(validate({ params: addressIdParamSchema }), deleteAddress);
router
  .route("/:addressId/set-default")
  .patch(validate({ params: addressIdParamSchema }), setDefaultAddress);

module.exports = router;
