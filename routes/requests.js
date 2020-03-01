const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

const {
  getRequests,
  addRequest,
  updateRequest,
  generateOtp
} = require("../controllers/requests");

router.get("/", auth, getRequests);

router.post("/", auth, addRequest);

router.get("/:id/otp", auth, generateOtp);

router.patch("/:id", auth, updateRequest);

module.exports = router;
