const Request = require("../models/Request");
const Transaction = require("../models/Transaction");
const Book = require("../models/Book");
const User = require("../models/User");

const constants = require("../constants/constants");
const { REQUEST_TYPE_REQUESTED, REQUEST_TYPE_GAVE } = constants;

const request_type_config = require("../config/request_type_config");
const {
  REQUEST_TRANSITIONS,
  OTP_REQUIRED,
  OWNER_ONLY_TRANSACTIONS
} = request_type_config;

// @desc    Get all requests
// @route   GET /api/v1/requests
// @access  Private
exports.getRequests = async (req, res, next) => {
  try {
    const requests = await Request.find()
      .or([{ fromUser: req.user_id }, { toUser: req.user_id }])
      .populate("fromUser")
      .populate("toUser")
      .populate("book");
    console.log(requests);

    res.status(200).json({
      success: true,
      data: requests.map(
        ({
          _id: id,
          fromUser: { _id: fromUserId, name: fromUserName },
          toUser: { _id: toUserId, name: toUserName },
          book: { _id: bookId, title, author },
          status
        }) =>
          buildRequestObj({
            id,
            fromUserId,
            fromUserName,
            toUserId,
            toUserName,
            bookId,
            title,
            author,
            status
          })
      )
    });
  } catch (error) {
    console.log(`Error on getting requests: ${error.message}`.red);
    res.status(500).json({
      success: false,
      errors: ["Unable to get requests", error.message]
    });
  }
};

// @desc    Add a request
// @route   GET /api/v1/requests
// @access  Private
exports.addRequest = async (req, res, next) => {
  try {
    const { book: bookId } = req.body;
    const { user_id } = req;

    const isRequestExists = await Request.count({
      fromUser: user_id,
      book: bookId
    });
    if (!!isRequestExists)
      throw new Error("You've already requested for this book");

    const book = await Book.findById(bookId).populate("owner");
    const {
      title,
      author,
      owner: { _id: toUserId, name: toUserName }
    } = book;

    if (toUserId.toString() === user_id)
      throw new Error("You cannot request your own book");

    const user = await User.findById(user_id);

    const { _id: fromUserId, name: fromUserName } = user;

    status = REQUEST_TYPE_REQUESTED;

    const request = new Request({
      fromUser: user_id,
      toUser: toUserId,
      book: bookId,
      status: status
    });

    const transaction = await Transaction.create({
      request: request.id,
      type: status
    });

    console.log(transaction);
    console.log(transaction.id);
    request.transactions = [transaction.id];
    request.save();

    res.status(201).json({
      success: true,
      data: buildRequestObj({
        id: request.id,
        fromUserId,
        fromUserName,
        toUserId,
        toUserName,
        bookId,
        title,
        author,
        status
      })
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      errors: ["Unable to add request", error.message]
    });
  }
};

// @desc    Update a request
// @route   PATCH /api/v1/requests/:id
// @access  Private
exports.updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, otp } = req.body;
    const { user_id } = req;

    const request = await Request.findById(id)
      .populate("fromUser")
      .populate("toUser")
      .populate("book");
    if (!request) throw new Error("Request is not available to update");

    // validate transition
    if (!REQUEST_TRANSITIONS[request.status].includes(status))
      throw new Error(`Invalid transition from ${request.status} to ${status}`);

    // validate authorization
    const is_owner_only = OWNER_ONLY_TRANSACTIONS.includes(status);
    if (is_owner_only && request.book.owner.toString() !== user_id)
      throw new Error("Only book owner can do this");
    else if (!is_owner_only && request.fromUser.id !== user_id)
      throw new Error("You are not authorized to do this");

    // validate otp
    if (OTP_REQUIRED.includes(status)) {
      if (!request.otp || otp !== request.otp) throw new Error("Invalid OTP");
      if (request.otpExpiresIn < new Date()) throw new Error("OTP Expired");
      request.otp = null;
      request.otpExpiresIn = null;
    }

    request.status = status;

    const transaction = await Transaction.create({
      request: request.id,
      type: status
    });

    request.transactions.push(transaction.id);
    request.save();

    const {
      _id: requestId,
      fromUser: { _id: fromUserId, name: fromUserName },
      toUser: { _id: toUserId, name: toUserName },
      book: { _id: bookId, title, author }
    } = request;

    await Book.findByIdAndUpdate(bookId, {
      isAvailable: status !== REQUEST_TYPE_GAVE
    });

    res.status(200).json({
      success: true,
      data: buildRequestObj({
        id: requestId,
        fromUserId,
        fromUserName,
        toUserId,
        toUserName,
        bookId,
        title,
        author,
        status
      })
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      errors: ["Unable to remove request", error.message]
    });
  }
};

// @desc    Generate an OTP
// @route   GET /api/v1/requests/:id/otp
// @access  Private
exports.generateOtp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id } = req;

    const request = await Request.findById(id);

    if (!request) throw new Error("Request not available");

    // authorization
    if (![REQUEST_TYPE_REQUESTED, REQUEST_TYPE_GAVE].includes(request.status)) {
      throw new Error(`Invalid state ${request.status} to generate OTP`);
    } else if (
      request.status === REQUEST_TYPE_REQUESTED &&
      request.toUser.toString() !== user_id
    ) {
      console.log(request.toUser, user_id);
      throw new Error(`Only book owner can generate OTP`);
    } else if (
      request.status === REQUEST_TYPE_GAVE &&
      request.fromUser.toString() !== user_id
    ) {
      throw new Error(`Only book receiver can generate OTP`);
    }

    // generate 4 digit random number for otp
    request.otp = Math.floor(1000 + Math.random() * 9000);

    // set otp timeout
    const inc = 1000 * 60 * 60; // an hour
    request.otpExpiresIn = new Date(new Date().getTime() + inc);

    request.save();

    res.status(200).json({
      success: true,
      data: {
        otp: request.otp
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      errors: ["Unable to generate otp", error.message]
    });
  }
};

const buildRequestObj = ({
  id,
  fromUserId,
  fromUserName,
  toUserId,
  toUserName,
  bookId,
  title,
  author,
  status
}) => {
  return {
    id,
    fromUser: {
      id: fromUserId,
      name: fromUserName
    },
    toUser: {
      id: toUserId,
      name: toUserName
    },
    book: {
      id: bookId,
      title,
      author
    },
    status
  };
};
