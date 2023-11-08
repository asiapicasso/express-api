import express from "express";
const router = express.Router();

router.get("/", function (req, res, next) {
  res.send("Ignition!");
});

router.get("/docs", function (req, res, next) {
  res.send("Here will be the docs!");
});

export default router;
