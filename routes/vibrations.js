import express from 'express';

import { Vibration } from '../models/vibration.js';
import { authenticateToken, getUid, verifyField } from './auth.js';
const router = express.Router();

// lister toutes les vibrations pour une famille de plante données


/*
router.get('my_vibrations', async (req, res, next) => {

    const ownerId = req.params.ownerId;
    // TODO verify jwt

    const myVibrations = await Vibration.find({ ownerId: ownerId });
    res.render('my_vibrations', { myVibrations });
}); */

router.get('/create', (req, res, next) => {
    res.render('new_vibration');
});

router.post('/create', authenticateToken, async (req, res, next) => {
    const { name, location, plantIds } = req.body;
    const ownerId = getUid(req);

    if (verifyField(name) && verifyField(location) && plantIds && verifyField(ownerId)) {
        // Créer une nouvelle vibration
        const createdVibration = await Vibration.create({
            name: name,
            location: location,
            plantIds: plantIds,
            ownerId: ownerId
        }).then(() => {
            res.send({ 'status': 'ok', 'message': 'Vibration créée avec succès' });
        }).catch((reason) => {
            res.status(500).send({ 'status': 'error', 'message': 'Erreur lors de la création de la vibration' });
        });
    } else {
        res.status(400).send({ 'status': 'not_ok', 'message': 'Certains champs sont manquants' });
    }
});

router.get('/:vibrationId', authenticateToken, async (req, res, next) => {
    const vibrationId = req.params.vibrationId;
    const vibration = await Vibration.findById(vibrationId).exec();
    res.render('vibration_info', { vibration });
});

export default router;