const { Router } = require("express");
const {
  submitContactMessage,
  getContactMessages,
  markContactMessageRead,
} = require("../controllers/contact.controller");
const { verifyJWT, verifyAdmin } = require("../shared/middleware/auth.middleware");
const validate = require("../shared/middleware/validate.middleware");
const { contactLimiter } = require("../shared/middleware/rateLimiter.middleware");
const {
  submitContactMessageSchema,
  contactMessageIdParamSchema,
} = require("../validators/contact.validators");

const router = Router();

// public — the Contact Us page
router.route("/").post(contactLimiter, validate({ body: submitContactMessageSchema }), submitContactMessage);

// admin only — an inbox for messages submitted above
router.route("/").get(verifyJWT, verifyAdmin, getContactMessages);
router
  .route("/:messageId/read")
  .patch(verifyJWT, verifyAdmin, validate({ params: contactMessageIdParamSchema }), markContactMessageRead);

module.exports = router;
