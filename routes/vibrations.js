import express from 'express';

import { Vibration } from '../models/vibration.js';
import { getUid, verifyField } from './auth.js';
import { Plant } from '../models/plant.js';
import { User } from '../models/user.js';
import { getUserName } from './users.js';
import { getPlantName } from './plants.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// lister toutes les vibrations pour une famille de plante données

/**
 * @api {get} /vibrations/my Liste de mes vibrations
 * @apiGroup Vibrations
 * @apiName GetMyVibrations
 * @apiDescription Récupère la liste des vibrations associées à l'utilisateur actuel.
 * @apiPermission Utilisateur authentifié
 * 
 * @apiHeader {String} Authorization Jeton d'authentification (Bearer Token) obtenu lors de la connexion.
 * 
 * @apiSuccess {Object[]} vibrations Liste des vibrations de l'utilisateur.
 * @apiSuccess {String} vibrations.id Identifiant de la vibration.
 * @apiSuccess {String} vibrations.name Nom de la vibration.
 * @apiSuccess {String} vibrations.location Emplacement de la vibration.
 * @apiSuccess {String} vibrations.ownerId Identifiant du propriétaire de la vibration.
 * @apiSuccess {String} vibrations.ownerName Nom du propriétaire de la vibration.
 * @apiSuccess {String} vibrations.plantName Nom de la plante associée à la vibration.
 * 
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * [
 *   {
 *     "id": "60eaf8d97acc6d318c72ab41",
 *     "name": "Vibration 1",
 *     "location": "Salon",
 *     "ownerId": "60eaf85f7acc6d318c72ab40",
 *     "ownerName": "John Doe",
 *     "plantName": "Rose"
 *   },
 *   {
 *     "id": "60eaf8e97acc6d318c72ab42",
 *     "name": "Vibration 2",
 *     "location": "Chambre",
 *     "ownerId": "60eaf85f7acc6d318c72ab40",
 *     "ownerName": "John Doe",
 *     "plantName": "Tulipe"
 *   }
 * ]
 * 
 * @apiError (Erreur d'authentification) 401 Unauthorized Le jeton d'authentification est manquant ou invalide.
 * @apiErrorExample {json} Erreur d'authentification
 * HTTP/1.1 401 Unauthorized
 * {
 *   "error": "Unauthorized"
 * }
 * 
 * @apiError (Erreur interne du serveur) 500 Internal Server Error Une erreur interne du serveur s'est produite.
 * @apiErrorExample {json} Erreur interne du serveur
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "error": "Internal Server Error"
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
            //console.log('CONTENT: ', vibration);
            vibration.plantName = await getPlantName(vibration.plantsIds);
            vibrations.push(vibration);
        }));
        res.render('my_vibrations', { vibrations });

    } else {
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
});

/**
 * @api {post} /vibrations/create Créer une nouvelle vibration
 * @apiGroup Vibrations
 * @apiName CreateVibration
 * @apiDescription Endpoint pour créer une nouvelle vibration.
 *
 * @apiHeader {String} Authorization Token d'authentification obtenu lors de la connexion.
 * 
 * @apiParam {String} name Nom de la vibration.
 * @apiParam {String} location Emplacement de la vibration (format JSON).
 * @apiParam {String} plantsIds Identifiants des plantes liées à la vibration (séparés par des virgules).
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
 *
 * @apiDefine AuthenticationError
 */
router.get('/:vibrationId', async (req, res, next) => {
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