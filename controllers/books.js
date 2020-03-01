const Book = require("../models/Book");

// @desc    Get all books
// @route   GET /api/v1/books
// @access  Private
exports.getBooks = async (req, res, next) => {
  try {
    const books = await Book.find().populate("owner");
    console.log(books);
    res.status(200).json({
      success: true,
      count: books.length,
      data: books.map(
        ({
          _id: id,
          title,
          author,
          isAvailable,
          owner: { _id: ownerId, name: ownerName }
        }) => ({
          id,
          title,
          author,
          isAvailable,
          owner: {
            id: ownerId,
            name: ownerName
          }
        })
      )
    });
  } catch (error) {
    console.log(`Error on getting books: ${error.message}`.red);
    res.status(500).json({
      success: false,
      errors: ["Unable to get books"]
    });
  }
};

// @desc    Add a book
// @route   GET /api/v1/books
// @access  Private
exports.addBook = async (req, res, next) => {
  try {
    const { title, author } = req.body;
    const book = await Book.create({
      title,
      author,
      isAvailable: true,
      owner: req.user_id
    });
    res.status(201).json({
      success: true,
      data: {
        id: book.id,
        title: book.title,
        author: book.author
      }
    });
  } catch (error) {
    console.log(`Error on adding book ${error.message}`.red);
    res.status(500).json({
      success: false,
      errors: ["Unable to add book", error.message]
    });
  }
};

// @desc    Delete a book
// @route   DELETE /api/v1/books/:id
// @access  Private
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      throw new Error("Book is not available to remove");
    }
    await book.remove();
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.log(`Error on deleting book: ${error.message}`.red);
    res.status(500).json({
      success: false,
      errors: ["Unable to remove book", error.message]
    });
  }
};
