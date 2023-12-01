import express from 'express';

import { Vibration } from '../models/vibration.js';
import { getUid, verifyField } from './auth.js';
import { Plant } from '../models/plant.js';
import { User } from '../models/user.js';
import { getUserName } from './users.js';
import { getPlantName } from './plants.js';
<<<<<<< HEAD
import { HttpStatusCodes } from "./http/httpstatuscode.js";
=======
>>>>>>> a207f64939c48320ba5948c0f64fbcc8b88baf25
import fs from 'fs';
import path from 'path';

const router = express.Router();

// lister toutes les vibrations pour une famille de plante données

/**
 * @api {get} /my Mes vibrations
 * @apiGroup Vibrations
 * @apiName GetMyVibrations
 * @apiDescription Récupère les vibrations de l'utilisateur connecté.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object[]} vibrations Liste des vibrations de l'utilisateur.
 * @apiSuccess {String} vibrations.id Identifiant unique de la vibration.
 * @apiSuccess {String} vibrations.plantName Nom de la plante associée à la vibration.
 * @apiSuccess {String} vibrations.ownerName Nom complet du propriétaire de la vibration.
 * @apiSuccess {String} vibrations.audioLink Lien vers le fichier audio de la vibration.
 * @apiSuccess {String} vibrations.createdAt Date de création de la vibration.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Vibrations fetched successfully",
 *   "vibrations": [
 *     {
 *       "id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *       "plantName": "Rose",
 *       "ownerName": "John Doe",
 *       "audioLink": "https://example.com/audio/rose_vibration.wav",
 *       "createdAt": "2023-01-01T12:00:00Z"
 *     },
 *     // ...
 *   ]
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Paramètres incorrects
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Error while fetching vibrations"
 * }
 */
router.get('/my', async (req, res, next) => {
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
<<<<<<< HEAD
        res.status(HttpStatusCodes.OK).json({ message: 'Vibrations fetched successfully', vibrations }).render('my_vibrations', { vibrations });

    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Error while fetching vibrations' }).redirect('/');
=======
        res.render('my_vibrations', { vibrations });

    } else {
        res.redirect('/');
>>>>>>> a207f64939c48320ba5948c0f64fbcc8b88baf25
    }
});

/**
 * @api {get} /create Nouvelle vibration
 * @apiGroup Vibrations
 * @apiName CreateNewVibration
 * @apiDescription Affiche le formulaire pour créer une nouvelle vibration.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiSuccess {Object[]} availablesPlants Liste des plantes disponibles.
 * @apiSuccess {String} availablesPlants.id Identifiant unique de la plante.
 * @apiSuccess {String} availablesPlants.name Nom de la plante.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "availablesPlants": [
 *     {
 *       "id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *       "name": "Rose"
 *     },
 *     // ...
 *   ]
 * }
 *
 * @apiErrorExample {json} Erreur - Erreur de récupération des plantes
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "message": "Error while fetching available plants"
 * }
 */
router.get('/create', async (req, res, next) => {
    const availablesPlants = await Plant.find().catch(err => {
        console.error(err);
    });

    res.render('new_vibration', { availablesPlants });
});

/**
 * @api {post} /create Créer une nouvelle vibration avec fichier audio
 * @apiGroup Vibrations
 * @apiName CreateNewVibrationWithAudio
 * @apiDescription Crée une nouvelle vibration avec les informations fournies, y compris un fichier audio.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiParam {String} name Nom de la vibration.
 * @apiParam {String} location Coordonnées de l'emplacement de la vibration (au format JSON).
 * @apiParam {String[]} plantsIds Liste des identifiants des plantes associées à la vibration.
 * @apiParam {String} audioFile Fichier audio encodé en base64.
 *
<<<<<<< HEAD
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object} vibration Informations sur la vibration créée.
=======
 * @apiError {String} status Statut de la requête.
 * @apiError {String} message Message d'erreur.
 *
 * @apiErrorExample {json} Erreur
 *    HTTP/1.1 400 Bad Request
 *    {
 *      "status": "not_ok",
 *      "message": "Certains champs sont manquants."
 *    }
 *
 * @apiErrorExample {json} Erreur
 *    HTTP/1.1 500 Internal Server Error
 *    {
 *      "status": "error",
 *      "message": "Erreur lors de la création de la vibration."
 *    }
 */
router.post('/create', async (req, res, next) => {

    const { name, location, plantsIds, audioFile } = req.body;

    console.log('audio file: ', req.body);

    const { uid } = getUid(req);

    if (verifyField(name) && verifyField(location) && plantsIds && verifyField(uid)) {
        console.log(name, location, plantsIds, audioFile);

        const createdVibration = await Vibration.create({
            name: name,
            location: JSON.parse(location),
            plantsIds: plantsIds,
            ownerId: uid
        }).then(async (vibration) => {
            const vibId = vibration._id.toString();

            const decodedAudio = Buffer.from(audioFile, 'base64');
            console.log('juskicio k');

            const directoryPath = `./bucket/vibrations/${vibId}/`;
            const filePath = path.join(directoryPath, `${vibId}.wav`);
            console.log(filePath);

            fs.mkdirSync(directoryPath, { recursive: true });

            try {
                fs.writeFileSync(filePath, decodedAudio);
            } catch (error) {
                console.error(error);
            }

            console.log(filePath);
            Vibration.findByIdAndUpdate(vibId, {
                audioPath: filePath
            }).then(updated => {
                console.log('je suis al');
                res.redirect('/vibrations/my');

            })
        }).catch((reason) => {
            res.status(500).send({ 'status': 'error', 'message': toString(reason) });
        });
    } else {
        res.status(400).send({ 'status': 'not_ok', 'message': 'Certains champs sont manquants' });
    }
});

/**
 * @api {get} /vibrations/:vibrationId Obtenir les détails d'une vibration
 * @apiGroup Vibrations
 * @apiName GetVibrationDetails
 *
 * @apiParam {String} vibrationId Identifiant unique de la vibration.
 *
 * @apiSuccess {Object} vibration Informations détaillées sur la vibration.
 * @apiSuccess {String} vibration.id Identifiant unique de la vibration.
 * @apiSuccess {String} vibration.name Nom de la vibration.
 * @apiSuccess {String} vibration.location Emplacement de la vibration.
 * @apiSuccess {String} vibration.plantIds Identifiants des plantes associées à la vibration.
 * @apiSuccess {String} vibration.ownerId Identifiant du propriétaire de la vibration.
>>>>>>> a207f64939c48320ba5948c0f64fbcc8b88baf25
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Vibration created successfully",
 *   "vibration": {
 *     "id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *     "name": "Vibration Name",
 *     "location": { "latitude": 123.456, "longitude": 78.90 },
 *     "plantsIds": ["plant_id_1", "plant_id_2"],
 *     "ownerId": "user_id",
 *     "audioPath": "/path/to/audio/file.wav",
 *     // ...
 *   }
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Paramètres incorrects
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Please provide the correct parameters"
 * }
 *
 * @apiErrorExample {json} Erreur - Erreur lors de la création
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "message": "Error while creating vibration"
 * }
 */
router.post('/create', async (req, res, next) => {
    const { name, location, plantsIds, audioFile } = req.body;
    const { uid } = getUid(req);

    if (verifyField(name) && verifyField(location) && plantsIds && verifyField(uid)) {

        Vibration.create({
            name: name,
            location: JSON.parse(location),
            plantsIds: plantsIds,
            ownerId: uid
        }).then(async (vibration) => {
            const vibId = vibration._id.toString();

            const decodedAudio = Buffer.from(audioFile, 'base64');

            const directoryPath = `./bucket/vibrations/${vibId}/`;
            const filePath = path.join(directoryPath, `${vibId}.wav`);
            console.log(filePath);

            fs.mkdirSync(directoryPath, { recursive: true });

            try {
                fs.writeFileSync(filePath, decodedAudio);
            } catch (error) {
                console.error(error);
            }

            console.log(filePath);
            Vibration.findByIdAndUpdate(vibId, {
                audioPath: filePath
            }).then(updated => {
                console.log('je suis al');
                res.status(HttpStatusCodes.OK).json({ message: 'Vibration created successfully', vibration: updated });
            })
        }).catch((reason) => {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Error while creating vibration' });
        });
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).send({ 'status': 'not_ok', 'message': 'Please provide the good params' });
    }
});

/**
 * @api {get} /:vibrationId Informations sur une vibration
 * @apiGroup Vibrations
 * @apiName GetVibrationById
 * @apiDescription Récupère les informations d'une vibration spécifiée par son identifiant.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiParam {String} vibrationId Identifiant unique de la vibration.
 *
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object} vibration Informations sur la vibration.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Vibration fetched successfully",
 *   "vibration": {
 *     "id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *     "name": "Vibration Name",
 *     "location": { "latitude": 123.456, "longitude": 78.90 },
 *     "plantsIds": ["plant_id_1", "plant_id_2"],
 *     "ownerId": "user_id",
 *     // ...
 *   }
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Paramètres incorrects
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Please provide the correct parameters"
 * }
 *
 * @apiErrorExample {json} Erreur - Vibration non trouvée
 * HTTP/1.1 404 Not Found
 * {
 *   "message": "Error while getting vibration"
 * }
 *
 * @apiDefine AuthenticationError
 */
router.get('/:vibrationId', async (req, res, next) => {
    const vibrationId = req.params.vibrationId;

    if (verifyField(vibrationId)) {
<<<<<<< HEAD
        Vibration.findById(vibrationId, (err, vibration) => {
            if (err) {
                res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Error while getting vibration' });
            } else {
                res.status(HttpStatusCodes.OK).json({ message: 'Vibration fetched successfully', vibration: vibration });
            }
        })
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Please provide the good params' });
=======
        const vibration = await Vibration.findById(vibrationId).catch(err => {
            console.error(err);
        });
        res.render('vibration_info', { vibration });
    } else {
        console.error('missing vibration id');
        res.redirect('/vibrations/my');
>>>>>>> a207f64939c48320ba5948c0f64fbcc8b88baf25
    }
});

export default router;