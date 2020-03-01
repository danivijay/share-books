const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookSchema = new mongoose.Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    title: {
      type: String,
      required: [true, "Title is required"]
    },
    author: {
      type: String,
      required: [true, "Author is required"]
    },
    isAvailable: {
      type: Boolean,
      required: [true, "Author is required"]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Book", BookSchema);
