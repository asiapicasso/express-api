import express from "express";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { hash, compare } from "bcrypt";
import { render } from "ejs";

const saltRounds = 10;

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login');
});

router.post("/login", async (req, res, next) => {
    // todo handle password and email -> then create the jwt linked to the account, by default status is reader
    const { email, password } = req.body;
    if (email && password) {
        // Votre logique d'authentification ici
        const user = await User.findOne({ email: email });

        if (user && await compare(password, user.password)) {
            // Créer le jeton JWT (par défaut, le statut est "reader")
            const token = generateAccessToken(user.id, process.env.JWT_SECRET);

            // Envoyer le jeton en réponse
            res.json({ token });
        } else {
            res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }


    } else {
        res.status(400).json({ error: "Email et mot de passe requis" });
    }
});


router.get('/sign_up', (req, res, next) => {
    res.render('sign_up');
});

router.post("/sign_up", async function(req, res, next) {
    const { firstname, lastname, email, password } = req.body;

    if (firstname != '' && lastname != '' && email != '' && password != '') {

        // hash the password from the user
        const hashed = await hash(password, saltRounds);


        const createdUser = await User.create({
            email: email,
            password: hashed,
            lastname: lastname,
            firstname: firstname
        }).then(createdUser => {
            // after compute lets indicate the user that the user is created
            console.info('user created');
            //res.send({ "status": "ok", "message": "user created" });
            const token = generateAccessToken(createdUser.id);
            res.json({ token });


        }).catch(error => {
            console.error('error while creating user');
            res.send({ "status": "error", "message": `something went wrong when creating account ${error}` });

        });
    } else {
        res.send({ "status": "error", "message": "something is missing" });
    }
});


export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
    if (token == undefined) return res.sendStatus(401)

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        console.log(err)

        if (err) return res.sendStatus(403);

        req.user = user;

        next();
    })
}

export function getUid(req) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
    const { uid } = jwt.verify(token, process.env.JWT_SECRET);
    return uid;
}

function generateAccessToken(uid) {
    return jwt.sign({ uid: uid }, process.env.JWT_SECRET);
}


export default router;

