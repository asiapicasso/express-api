import express from 'express';

import { Vibration } from '../models/vibration.js';
import { getUid, verifyField } from './auth.js';
import { Plant } from '../models/plant.js';
import { User } from '../models/user.js';
import { getUserName } from './users.js';
import { getPlantName } from './plants.js';
import { HttpStatusCodes } from "./http/httpstatuscode.js";
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = express.Router();
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const directoryPath = `./bucket/vibrations/`;

        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        cb(null, directoryPath);
    },
    filename: function(req, file, cb) {
        const filePath = path.join(`./bucket/vibrations/`, file.originalname);

        if (fs.existsSync(filePath)) {
            // Fichier existe déjà, rejeter la requête
            cb(new Error('Le fichier existe déjà'), null);
        } else {
            // Fichier n'existe pas, continuer
            cb(null, file.originalname);
        }
    }
});



const upload = multer({ storage: storage });

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
        res.status(HttpStatusCodes.OK).json({ message: 'Vibrations fetched successfully', vibrations })/* .render('my_vibrations', { vibrations }) */;

    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Error while fetching vibrations' }).redirect('/');
    }
});


router.get('/all', async (req, res, next) => {
    const { uid } = getUid(req);

    if (verifyField(uid)) {
        const fetchedVibrations = await Vibration.find();
        const vibrations = [];

        // Utilisation de Promise.all pour traiter les opérations asynchrones en parallèle
        await Promise.all(fetchedVibrations.map(async (vibration) => {
            vibration.ownerName = await getUserName(vibration.ownerId);
            console.log('CONTENT: ', vibration);
            vibration.plantName = await getPlantName(vibration.plantsIds);
            vibrations.push(vibration);
        }));
        res.status(HttpStatusCodes.OK).json({ message: 'Vibrations fetched successfully', vibrations })/* .render('my_vibrations', { vibrations }) */;

    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Error while fetching vibrations' }).redirect('/');
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

/*     res.render('new_vibration', { availablesPlants }); 
 */});

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
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object} vibration Informations sur la vibration créée.
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
router.post('/create', upload.single('audio'), async (req, res) => {
    // Analyse les données du formulaire    


    const vibrationData = JSON.parse(req.body.vibration);
    console.log("body: ", vibrationData);
    const { name, location, plantsIds } = vibrationData;
    const { uid } = getUid(req);


    if (verifyField(name) && location && plantsIds && verifyField(uid)) {
        try {
            const vibration = await Vibration.create({
                name: name,
                location: location,
                plantsIds: plantsIds,
                ownerId: uid,
                vibrationPath: req.file.path
            });

            res.status(HttpStatusCodes.OK).json({ message: 'Vibration created successfully', vibration });
        } catch (error) {
            console.error('Error creating vibration', error);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error while creating vibration' });
        }
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Please provide the correct parameters' });
    }
});

/* router.post('/create', async (req, res, next) => {
    const { name, location, plantsIds, audioFile } = req.body;
    const { uid } = getUid(req);
    console.log(name, location, plantsIds, audioFile);
    if (verifyField(name) && verifyField(location) && plantsIds && verifyField(uid)) {

        // Vérifiez si audioFile est présent
        if (audioFile) {
            const decodedAudio = Buffer.from(audioFile, 'base64');

            const directoryPath = `./bucket/vibrations/${vibId}/`;
            const filePath = path.join(directoryPath, `${vibId}.wav`);

            fs.mkdirSync(directoryPath, { recursive: true });

            try {
                fs.writeFileSync(filePath, decodedAudio);
            } catch (error) {
                console.error(error);
            }
        }

        // Créez la vibration sans audioPath
        Vibration.create({
            name: name,
            location: JSON.parse(location),
            plantsIds: plantsIds,
            ownerId: uid
        }).then(async (vibration) => {
            const vibId = vibration._id.toString();

            // Si audioFile était présent, mettez à jour audioPath
            if (audioFile) {
                Vibration.findByIdAndUpdate(vibId, {
                    audioPath: filePath
                }).then(updated => {
                    console.log('Vibration created successfully with audio file');
                    res.status(HttpStatusCodes.OK).json({ message: 'Vibration created successfully', vibration: updated });
                });
            } else {
                console.log('Vibration created successfully without audio file');
                res.status(HttpStatusCodes.OK).json({ message: 'Vibration created successfully', vibration: vibration });
            }
        }).catch((reason) => {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Error while creating vibration' });
        });
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).send({ 'status': 'not_ok', 'message': 'Please provide the good params' });
    }
}); */

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
 */
router.get('/:vibrationId', async (req, res, next) => {
    const vibrationId = req.params.vibrationId;

    if (verifyField(vibrationId)) {
        Vibration.findById(vibrationId, (err, vibration) => {
            if (err) {
                res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Error while getting vibration' });
            } else {
                res.status(HttpStatusCodes.OK).json({ message: 'Vibration fetched successfully', vibration: vibration });
            }
        })
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Please provide the good params' });
    }
});


// Endpoint pour récupérer le fichier audio
router.get('/audio/:vibrationId', async (req, res) => {
    const vibrationId = req.params.vibrationId;

    try {
        const vibration = await Vibration.findById(vibrationId).exec();
        if (!vibration) {
            return res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Vibration not found' });
        }

        const audioPath = vibration.vibrationPath;
        if (!audioPath) {
            return res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Audio file not found for this vibration' });
        }

        const data = await fs.promises.readFile(audioPath);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(data);
    } catch (err) {
        console.error(err);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error while processing request' });
    }
});


router.delete('/:vibrationId', async (req, res) => {
    const vibrationId = req.params.vibrationId;

    try {
        const deletedVibration = await Vibration.findByIdAndDelete(vibrationId);

        if (!deletedVibration) {
            return res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Vibration not found' });
        }

        // Supprimez également le fichier audio associé s'il existe
        if (deletedVibration.vibrationPath) {
            fs.unlinkSync(deletedVibration.vibrationPath);
        }

        res.status(HttpStatusCodes.OK).json({ message: 'Vibration deleted successfully' });
    } catch (error) {
        console.error('Error deleting vibration', error);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error while deleting vibration' });
    }
});

router.put('/update/:vibrationId', async (req, res) => {
    const vibrationId = req.params.vibrationId;

    // Récupérez les nouvelles données de vibration à partir de la requête
    const { name, location, plantsIds } = req.body;


    console.log(name, location, plantsIds);

    // Vérifiez si les données sont valides
    if (!verifyField(vibrationId)) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Invalid vibration ID' });
    }

    try {
        // Recherchez la vibration à mettre à jour par son ID
        const existingVibration = await Vibration.findById(vibrationId);

        if (!existingVibration) {
            return res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Vibration not found' });
        }

        // Mettez à jour uniquement les champs non vides
        if (name) {
            existingVibration.name = name;
        }

        if (location) {
            existingVibration.location = location;
        }

        if (plantsIds) {
            existingVibration.plantsIds = plantsIds;
        }

        // Enregistrez les modifications dans la base de données
        const updatedVibration = await existingVibration.save();

        res.status(HttpStatusCodes.OK).json({ message: 'Vibration updated successfully', updatedVibration });
    } catch (error) {
        console.error('Error updating vibration', error);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error while updating vibration' });
    }
});



export default router;