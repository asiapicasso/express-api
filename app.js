import express from "express";
import createError from "http-errors";
import logger from "morgan";
// 1 router per endpoint
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import vibrationsRouter from "./routes/vibrations.js";
import authRouter from "./routes/auth.js";
import mongoose from 'mongoose';
import * as config from "./config.js";
import bodyParser from 'body-parser';


mongoose.Promise = Promise;
mongoose.connect("mongodb+srv://admin:bwHyzELDBMYRyXkXd8AX9Rn5RaikxmwhQB3pkiGhrFSWfGdN6@express-api.yzhgytr.mongodb.net/test?retryWrites=true&w=majority");



const app = express();
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// there, all the api endpoints
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/vibrations", vibrationsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});

export default app;
