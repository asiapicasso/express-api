import express from "express";

import { Vibration } from "../models/vibration.js";
import { authenticateToken } from "./auth.js";
const router = express.Router();

// lister toutes les vibrations pour une famille de plante données

/* router.get("/:vibrationId", async function(req, res, next) {
    // Récupérer l'objet Vibration en fonction de l'ID dans la route
    const vibrationId = req.params.vibrationId;
    const vibration = await Vibration.findById(vibrationId).exec();

    // Rendre la vue avec les informations sur la vibration
    res.render('vibration', { vibration });
});

router.get('my_vibrations', async (req, res, next) => {

    const ownerId = req.params.ownerId;
    // TODO verify jwt

    const myVibrations = await Vibration.find({ ownerId: ownerId });
    res.render('my_vibrations', { myVibrations });
}); */

router.get("/create", authenticateToken, (req, res, next) => {
    res.render('new_vibration');
});

router.post("/create", authenticateToken, async (req, res, next) => {
    const { name, location, familyId, ownerId } = req.body;

    // todo check jwt

    if (name != '' && location != '' && familyId != '' && ownerId != '') {
        // Créer une nouvelle vibration
        const createdVibration = await Vibration.create({
            name: name,
            location: location,
            familyId: familyId,
            ownerId: ownerId
        }).then(() => {
            res.send({ "status": "ok", "message": "Vibration créée avec succès" });
        }).catch((reason) => {
            res.status(500).send({ "status": "error", "message": "Erreur lors de la création de la vibration" });
        });
    } else {
        res.status(400).send({ "status": "not_ok", "message": "Certains champs sont manquants" });
    }
});






export default router;