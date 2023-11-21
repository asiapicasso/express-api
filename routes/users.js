import express from "express";
import { User } from "../models/user.js";
import { hash, compare } from "bcrypt";
import { authenticateToken } from "./auth.js";
const router = express.Router();

router.get("/", authenticateToken, async (req, res, next) => {
  const users = await User.find();
  res.render('users', { users });
});


router.get("/read", authenticateToken, (req, res, next) => {
  //TODO read user id from body and display it from mangdb


});

router.post("/update", authenticateToken, async function(req, res, next) {
  //TODO update the user from user id in body
  const { id } = req.body;

  if (id == undefined) {
    res.send({ "status": "error", "message": "please provide the good params" });
  }

  // TODO verify that only user owner can update his profile



  // i set toto for exemple but you can change everything you want.
  // you must check in the req body which param you want to allow the user to update and then set it in the updateOne function
  try {
    await User.updateOne({ _id: "id" }, { firstname: "toto" });

  } catch (error) {
    res.send({ "status": "error", "message": "error while updating user" });
  }
});


router.post("/delete", authenticateToken, async (req, res, next) => {

  const { id } = req.body;
  // TODO verify that only user owner can delete his profile

  if (id == undefined) {
    res.send({ "status": "error", "message": "please provide the good params" });

  }

  try {

    await User.findByIdAndDelete(id);
    res.send({ "status": "success", "message": "user successfully deleted" });
  } catch (error) {
    res.send({ "status": "error", "message": "error while deleting user" });
  }
});

export default router;
