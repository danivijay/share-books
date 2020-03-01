const express = require("express");
const colors = require("colors");
const morgan = require("morgan");
const connectDB = require("./config/db");

require("dotenv").config({ path: "./config/config.env" });

connectDB();

const bookRoutes = require("./routes/books");
const userRoutes = require("./routes/users");
const requestRoutes = require("./routes/requests");

const app = express();
app.use(express.json());

app.use("/api/v1/books", bookRoutes);
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/requests", requestRoutes);

const PORT = process.env.PORT;
app.listen(
  PORT,
  console.log(
    `Server Running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);
