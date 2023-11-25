import express from "express";
import createError from "http-errors";


import jwt from "jsonwebtoken";
import logger from "morgan";
// 1 router per endpoint
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import vibrationsRouter from "./routes/vibrations.js";
import plantsRouter from "./routes/plants.js";
import authRouter from "./routes/auth.js";
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";

mongoose.Promise = Promise;
dotenv.config();
mongoose.connect(process.env.DATABASE_URL);



const app = express();
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// there, all the api endpoints
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/vibrations", vibrationsRouter);
app.use("/plants", plantsRouter);



// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});




// catch 404 and forward to error handler
app.get('*', (req, res) => {
  res.status(404).render('not_found.ejs');
});





export default app;
