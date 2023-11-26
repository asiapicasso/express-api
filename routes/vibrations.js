import express from 'express';

import { Vibration } from '../models/vibration.js';
import { authenticateToken, getUid, verifyField } from './auth.js';
import { Plant } from '../models/plant.js';
import { User } from '../models/user.js';
import { getUserName } from './users.js';
import { getPlantName } from './plants.js';
const router = express.Router();

// lister toutes les vibrations pour une famille de plante données



router.get('/my', authenticateToken, async (req, res, next) => {
    const { uid } = getUid(req);

    if (verifyField(uid)) {
        const fetchedVibrations = await Vibration.find({ ownerId: uid });
        const vibrations = [];

        // Utilisation de Promise.all pour traiter les opérations asynchrones en parallèle
        await Promise.all(fetchedVibrations.map(async (vibration) => {
            vibration.ownerName = await getUserName(vibration.ownerId);
            console.log('CONTENT: ', vibration);
            vibration.plantName = await getPlantName(vibration.plantsIds);
            vibrations.push(vibration);
        }));
        res.render('my_vibrations', { vibrations });

    } else {
        res.redirect('/');
    }
});

router.get('/create', authenticateToken, async (req, res, next) => {
    const availablesPlants = await Plant.find().catch(err => {
        console.error(err);
    });

    res.render('new_vibration', { availablesPlants });
});

router.post('/create', authenticateToken, async (req, res, next) => {
    const { name, location, plantsIds } = req.body;


    const { uid } = getUid(req);

    if (verifyField(name) && verifyField(location) && plantsIds && verifyField(uid)) {
        // Créer une nouvelle vibration
        console.log('plant id', plantsIds);

        const createdVibration = await Vibration.create({
            name: name,
            location: JSON.parse(location),
            plantsIds: plantsIds,
            ownerId: uid
        }).then(() => {
            res.redirect('/vibrations/my');
        }).catch((reason) => {
            res.status(500).send({ 'status': 'error', 'message': 'Erreur lors de la création de la vibration' });
        });
    } else {
        res.status(400).send({ 'status': 'not_ok', 'message': 'Certains champs sont manquants' });
    }
});

router.get('/:vibrationId', authenticateToken, async (req, res, next) => {
    const vibrationId = req.params.vibrationId;

    if (verifyField(vibrationId)) {
        const vibration = await Vibration.findById(vibrationId).catch(err => {
            console.error(err);
        });
        res.render('vibration_info', { vibration });
    } else {
        console.error('missing vibration id');
        res.redirect('/vibrations/my');
    }
});

export default router;