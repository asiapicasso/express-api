import express from "express";
import {MongoClient} from "mongodb";
const router = express.Router();

/*router.options("/", function (req, res, next) {
  res.set("Allow", "GET, POST, PATCH, DELETE, OPTIONS");
  res.status(204).send();
});*/

router.get("/", async function (req, res, next) {
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

router.post("/create", function (req, res, next) {
  // TODO create a user in mangoDB
  /* const {firstname, lastname} =  req.body;

  console.debug(firstname);
  if(firstname != ''){


    // TODO populate my db


    // after compute lets indicate the user that the user is created
    res.send({"status": "ok", "message": "user created"});


  }else{
    res.send({"status": "not_ok", "message": "something is missing"});

  }


 */

});

router.get("/read", function (req, res, next) {
  //TODO read user id from body and display it from mangdb


});

router.get("/update", function (req, res, next) {
//TODO update the user from user id in body


});

router.get("/delete", function (req, res, next) {
  //TODO delete the user from user id in body


});


export default router;
