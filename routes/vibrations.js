import express from 'express';

import { Vibration } from '../models/vibration.js';
import { getUid, verifyField } from './auth.js';
import { Plant } from '../models/plant.js';
import { User } from '../models/user.js';
import { getUserName } from './users.js';
import { getPlantName } from './plants.js';
import { HttpStatusCodes } from "./http/httpstatuscode.js";

const router = express.Router();

// lister toutes les vibrations pour une famille de plante données

/**
 * @api {get} /my Fetch user's vibrations
 * @apiName GetMyVibrations
 * @apiGroup Vibrations
 * @apiDescription Fetches vibrations associated with the authenticated user.

 * @apiHeader {String} Authorization User's access token.

 * @apiSuccess {Number} status HTTP status code (200 for success).
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object[]} vibrations List of user's vibrations.
 * @apiSuccess {String} vibrations.ownerName Owner's name of the vibration.
 * @apiSuccess {String} vibrations.plantName Plant's name associated with the vibration.

 * @apiError {Number} status HTTP status code (400 for bad request).
 * @apiError {String} message Error message.

 * @apiErrorExample {json} Error Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": 400,
 *       "message": "Error while fetching vibrations"
 *     }
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 200,
 *       "message": "Vibrations fetched successfully",
 *       "vibrations": [
 *         {
 *           "ownerName": "John Doe",
 *           "plantName": "Rose",
 *           // ... other vibration properties
 *         },
 *         // ... additional vibrations
 *       ]
 *     }
 *
 * @apiErrorExample {json} Unauthorized Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "status": 401,
 *       "message": "Unauthorized. Please provide a valid access token."
 *     }
 */
router.get('/my', async (req, res, next) => {
    const { uid } = getUid(req);

    if (verifyField(uid)) {
        const fetchedVibrations = await Vibration.find({ ownerId: uid });
        const vibrations = [];

        // Utilisation de Promise.all pour traiter les opérations asynchrones en parallèle
        await Promise.all(fetchedVibrations.map(async (vibration) => {
            vibration.ownerName = await getUserName(vibration.ownerId);
            //console.log('CONTENT: ', vibration);
            vibration.plantName = await getPlantName(vibration.plantsIds);
            vibrations.push(vibration);
        }));
        res.status(HttpStatusCodes.OK).json({ message: 'Vibrations fetched successfully', vibrations });
        res.render('my_vibrations', { vibrations });

    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Error while fetching vibrations' });
        res.redirect('/');
    }
});

/**
 * @api {get} /vibrations/create Afficher la page de création de vibration
 * @apiGroup Vibrations
 * @apiName AfficherPageCreationVibration
 * @apiDescription Récupère la liste des plantes disponibles et affiche la page de création de vibration.
 * @apiPermission authenticated user
 * 
 * @apiHeader {String} Authorization JWT Token de l'utilisateur authentifié.
 * 
 * @apiSuccess {html} page Page HTML de création de vibration avec la liste des plantes disponibles.
 * 
 * @apiSuccessExample {html} Success
 * HTTP/1.1 200 OK
 * <html>
 *  <!-- Contenu HTML de la page de création de vibration -->
 * </html>
 * 
 * @apiError (Error 401) Unauthorized Utilisateur non authentifié.
 * @apiError (Error 500) InternalServerError Erreur interne du serveur.
 * 
 * @apiErrorExample Unauthorized:
 * HTTP/1.1 401 Unauthorized
 * {
 *   "error": "Unauthorized"
 * }
 * 
 * @apiErrorExample InternalServerError:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "error": "Internal Server Error"
 * }
 */
router.get('/create', async (req, res, next) => {
    const availablesPlants = await Plant.find().catch(err => {
        console.error(err);
    });

    res.render('new_vibration', { availablesPlants });

    /* if (verifyField(name) && verifyField(location) && plantsIds && verifyField(uid)) {
            const createdVibration = await Vibration.create({
                name,
                location: JSON.parse(location),
                plantsIds,
                ownerId: uid
            });
    
            res.status(HttpStatusCodes.OK).json({ message: 'Vibration created successfully' });
        } else {
            res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Missing params' });
        } */
});

/**
 * @api {post} /vibrations/create Créer une nouvelle vibration
 * @apiGroup Vibrations
 * @apiName CreateVibration
 * @apiDescription Endpoint pour créer une nouvelle vibration.
 *
 * @apiHeader {String} Authorization Token d'authentification obtenu lors de la connexion.
 * 
 * @apiBody {String} name Nom de la vibration.
 * @apiBody {String} location Emplacement de la vibration (format JSON).
 * @apiBody {String} plantsIds Identifiants des plantes liées à la vibration (séparés par des virgules).
 *
 * @apiSuccess {String} status Statut de la requête.
 * @apiSuccess {String} message Message de succès ou d'erreur.
 * 
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 302 Found
 *    {
 *      "status": "ok",
 *      "message": "Vibration créée avec succès."
 *    }
 *
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

    const { name, location, plantsIds } = req.body;
    const { uid } = getUid(req);

    if (verifyField(name) && verifyField(location) && plantsIds && verifyField(uid)) {
        // Créer une nouvelle vibration
        //console.log('plant id', plantsIds);
        const createdVibration = await Vibration.create({
            name: name,
            location: JSON.parse(location),
            plantsIds: plantsIds,
            ownerId: uid
        }).then(() => {
            res.redirect('/vibrations/my');
        }).catch((reason) => {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Erreur lors de la création de la vibration', vibration });
            //res.status(500).send({ 'status': 'error', 'message': 'Erreur lors de la création de la vibration' });
        });
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Certains champs sont manquants' });
        //res.status(400).send({ 'status': 'not_ok', 'message': 'Certains champs sont manquants' });
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
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "vibration": {
 *     "id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *     "name": "Nom de la vibration",
 *     "location": "Emplacement de la vibration",
 *     "plantIds": "Identifiants des plantes associées à la vibration",
 *     "ownerId": "Identifiant du propriétaire de la vibration"
 *   }
 * }
 *
 * @apiError {String} error Message d'erreur indiquant la raison de l'échec.
 * @apiErrorExample {json} Erreur - Paramètre manquant
 * HTTP/1.1 400 Bad Request
 * {
 *   "error": "Identifiant de la vibration manquant"
 * }
 *
 * @apiErrorExample {json} Erreur - Vibration introuvable
 * HTTP/1.1 404 Not Found
 * {
 *   "error": "Vibration introuvable"
 * }
 */
router.get('/:vibrationId', async (req, res, next) => {
    const vibrationId = req.params.vibrationId;

    if (verifyField(vibrationId)) {
        const vibration = await Vibration.findById(vibrationId).catch(err => {
            //console.error(err);
        });
        res.status(HttpStatusCodes.OK).json({ message: 'Vibration fetched successfully', vibration });

        res.render('vibration_info', { vibration });
    } else {
        //console.error('missing vibration id');
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Missing params' });

        res.redirect('/vibrations/my');
    }
});

export default router;