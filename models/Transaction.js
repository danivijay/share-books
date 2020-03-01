const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const request_type_config = require("../config/request_type_config");
const { REQUEST_TYPES } = request_type_config;

const TransactionSchema = new mongoose.Schema(
  {
    request: { type: Schema.Types.ObjectId, ref: "Request" },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: REQUEST_TYPES
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
