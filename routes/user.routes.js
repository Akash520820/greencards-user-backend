const { Router } = require("express");
const {
  registerUser,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/user.controller");
const upload = require("../shared/middleware/multer.middleware");
const { verifyJWT } = require("../shared/middleware/auth.middleware");
const { authLimiter, otpLimiter } = require("../shared/middleware/rateLimiter.middleware");
const validate = require("../shared/middleware/validate.middleware");
const {
  registerUserSchema,
  verifyRegistrationOtpSchema,
  resendRegistrationOtpSchema,
  loginUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/user.validators");

const router = Router();

// NOTE: multer must run before validate() on multipart routes — it's what
// populates req.body from the form-data fields in the first place.
router
  .route("/register")
  .post(authLimiter, upload.single("avatar"), validate({ body: registerUserSchema }), registerUser);
router.route("/verify-otp").post(authLimiter, validate({ body: verifyRegistrationOtpSchema }), verifyRegistrationOtp);
router.route("/login").post(authLimiter, validate({ body: loginUserSchema }), loginUser);
router.route("/resend-otp").post(otpLimiter, validate({ body: resendRegistrationOtpSchema }), resendRegistrationOtp);

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/forgot-password").post(authLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
router.route("/reset-password").post(authLimiter, validate({ body: resetPasswordSchema }), resetPassword);

module.exports = router;
