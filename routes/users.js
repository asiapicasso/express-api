import express from "express";
import mongoose from "mongoose";
import { hash, compare } from "bcrypt";
const saltRounds = 10;
const router = express.Router();


// mango models
// they must be defined a single time
// define the user schema

/**
 * @typedef {Object} User
 * @property {string} firstname - Le prénom de l'utilisateur.
 * @property {string} lastname - Le nom de l'utilisateur.
 * @property {string} email - L'adresse e-mail de l'utilisateur.
 * @property {string} password - Le mot de passe de l'utilisateur.
 */

/**
 * Modèle de l'utilisateur.
 * @type {mongoose.Model<User>}
 */
const User = mongoose.model('User', mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String
}));





router.post("/", async function (req, res, next) {
  console.debug(req.read());

  res.send("Got a response from the users route");
  /* // we'll add code here soon
  const uri = "mongodb+srv://admin:pass@localhost/test?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  
  
  try {
    console.debug("Connecting to the db");
    await client.connect();
 
    await listDatabases(client);
 
} catch (e) {
    console.error(e);
}finally {
  await client.close();
} */



});

router.post("/create", async function (req, res, next) {
  const { firstname, lastname, email, password } = req.body;

  if (firstname != '' && lastname != '' && email != '' && password != '') {

    // hash the password from the user
    const hashed = await hash(password, saltRounds);



    const createdUser = await User.create({
      email: email,
      password: hashed,
      lastname: lastname,
      firstname: firstname
    });

    console.log(createdUser.id);

    // after compute lets indicate the user that the user is created
    res.send({ "status": "ok", "message": "user created" });


  } else {
    res.send({ "status": "not_ok", "message": "something is missing" });

  }




});

router.get("/read", function (req, res, next) {
  //TODO read user id from body and display it from mangdb


});

router.post("/update", async function (req, res, next) {
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


router.post("/delete", async function (req, res, next) {

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
