const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

const { getBooks, addBook, deleteBook } = require("../controllers/books");

router.get("/", getBooks);

router.post("/", auth, addBook);

router.delete("/:id", auth, deleteBook);

module.exports = router;
