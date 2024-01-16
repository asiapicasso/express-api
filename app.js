import express from "express";
import createError from "http-errors";

import jwt from "jsonwebtoken";
import logger from "morgan";
import path from "path";
import { fileURLToPath } from 'url';
//import cors from 'cors';

// 1 router per endpoint
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import vibrationsRouter from "./routes/vibrations.js";
import plantsRouter from "./routes/plants.js";
import authRouter, { handleAuth } from "./routes/auth.js";

import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import { HttpStatusCodes } from "./routes/http/httpstatuscode.js";

import cors from 'cors';

mongoose.Promise = Promise;
dotenv.config();
mongoose.connect(process.env.DATABASE_URL);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//app.use(cors())

const app = express();

app.use(cors());

// mise ici pour éviter le middleware de vérification d'authentification
app.use("/docs", express.static(path.join(__dirname, "docs")));

app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// auth handler: manage to control access:
app.use(handleAuth);

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
  res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
  //res.send(err.message);
});


// catch 404 and forward to error handler
app.get('*', (req, res) => {
  res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Not Found" }).render('not_found.ejs');
  //res.status(404).render('not_found.ejs');
});


export default app;
