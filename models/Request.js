const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const request_type_config = require("../config/request_type_config");
const { REQUEST_TYPES } = request_type_config;

const RequestSchema = new mongoose.Schema(
  {
    fromUser: { type: Schema.Types.ObjectId, ref: "User" },
    toUser: { type: Schema.Types.ObjectId, ref: "User" },
    book: { type: Schema.Types.ObjectId, ref: "Book" },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: REQUEST_TYPES
    },
    otp: Number,
    otpExpiresIn: Date,
    transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Request", RequestSchema);
