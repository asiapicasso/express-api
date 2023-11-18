import express from "express";
import { MongoClient } from "mongodb";
import * as jwt from "jsonwebtoken";
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login');
});

router.post("/login", (req, res, next) => {
    // todo handle password and email -> then create the jwt linked to the account, by default status is reader
    const { email, password } = req.body;
    if (email && password) {
        // Votre logique d'authentification ici

        if (false) {
            // Créer le jeton JWT (par défaut, le statut est "reader")
            const token = jwt.sign({ email, status: 'reader' }, 'votreSecretKey');

            // Envoyer le jeton en réponse
            res.json({ token });
        } else {
            res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }


    } else {
        res.status(400).json({ error: "Email et mot de passe requis" });
    }
});

export default router;

