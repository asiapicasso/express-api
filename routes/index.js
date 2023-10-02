import express from "express";
const router = express.Router();

router.get("/", function (req, res, next) {
  res.send("Ignition!");
});

router.get("/hello", function (req, res, next) {
  res.send("I said u hello!");
});

export default router;
