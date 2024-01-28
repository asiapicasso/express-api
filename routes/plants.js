import express from "express";
import { Plant } from "../models/plant.js";
import { hash, compare } from "bcrypt";
import { getUid, verifyField } from "./auth.js";
import { HttpStatusCodes } from "./http/httpstatuscode.js";

const router = express.Router();

router.get('/all', async (req, res, next) => {
    const { uid } = getUid(req);

    try {
        const plants = await Plant.find().exec();
        res.status(HttpStatusCodes.OK).json({ message: "Plants fetched successfully", plants: plants });

    } catch (err) {
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});


/**
 * @api {get} /my Récupérer mes plantes
 * @apiGroup Users
 * @apiName GetMyPlants
 * @apiDescription Récupère la liste des plantes créées par l'utilisateur actuel.
 *
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object[]} plants Liste des plantes de l'utilisateur.
 * @apiSuccess {String} plants._id Identifiant unique de la plante.
 * @apiSuccess {String} plants.name Nom de la plante.
 * @apiSuccess {String} plants.ownerId Identifiant de l'utilisateur qui a créé la plante.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Plants fetched successfully",
 *   "plants": [
 *     {
 *       "_id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *       "name": "Rose",
 *       "ownerId": "123456789"
 *     },
 *     {
 *       "_id": "5f7b5b0b0b5b5b0b0b5b5b0c",
 *       "name": "Tulipe",
 *       "ownerId": "123456789"
 *     }
 *   ]
 * }
 *
 * @apiError {String} error Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "error": "Internal Server Error"
 * }
 */
router.get('/my', async (req, res, next) => {
    const { uid } = getUid(req);

    try {
        if (verifyField(uid)) {
            const plants = await Plant.find({ ownerId: uid }).exec();
            res.status(HttpStatusCodes.OK).json({ message: "Plants fetched successfully", plants: plants });
        } else {
            res.status(HttpStatusCodes.BAD_REQUEST).json({ error: 'Please provide the good params' });
        }
    } catch (err) {
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

/**
 * @api {get} /plants/:id Récupérer une plante
 * @apiGroup Plants
 * @apiName GetPlant
 * @apiDescription Récupère une plante en fonction de son identifiant.
 * @apiPermission authenticated
    *   
    * @apiParam {String} id Identifiant unique de la plante.
    * 
    * @apiSuccess {String} id Identifiant unique de la plante.
    * @apiSuccess {String} name Nom de la plante.
    * @apiSuccess {String} ownerId Identifiant de l'utilisateur propriétaire de la plante.
    * 
    * @apiSuccessExample {json} Succès
    * HTTP/1.1 200 OK
    * {
    *   "id": "5f7b5b0b0b5b5b0b0b5b5b0b",
    *  "name": "Rose",
    * "ownerId": "123456789"
    * },
    * {
    *   "id": "5f7b5b0b0b5b5b0b0b5b5b0b",
    *  "name": "autre",
    * "ownerId": "123456789"
    * }
    */
router.get('/create', (req, res, next) => {
    /*   res.render('new_plant');*/
});

/**
 * @api {post} /create Créer une plante
 * @apiGroup Plants
 * @apiName CreatePlant
 * @apiDescription Crée une nouvelle plante.
 *
 * @apiParam {String} name Nom de la plante.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object} plant Informations sur la plante créée.
 * @apiSuccess {String} plant._id Identifiant unique de la plante.
 * @apiSuccess {String} plant.name Nom de la plante.
 * @apiSuccess {String} plant.ownerId Identifiant de l'utilisateur qui a créé la plante.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 201 Created
 * {
 *   "message": "Plant created successfully",
 *   "plant": {
 *     "_id": "5f7b5b0b0b5b5b0b0b5b5b0d",
 *     "name": "Nouvelle Plante",
 *     "ownerId": "123456789"
 *   }
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Error while creating plant"
 * }
 * 
 * @apiErrorExample {json} Erreur - Mauvais paramètres
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Please provide the good params"
 * }
 *
 * @apiErrorExample {json} Erreur - Non autorisé
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Please provide the good params"
 * }
 */
router.post("/create", async (req, res, next) => {
    const { name } = req.body;
    const { uid, isAdmin } = getUid(req);

    console.log(name, uid, isAdmin);

    if (verifyField(name) && verifyField(uid) && isAdmin) {
        await Plant.create({
            name: name,
            ownerId: uid
        }).then(createdPlant => {
            res.status(HttpStatusCodes.CREATED).json({ message: "Plant created successfully", plant: createdPlant });
        }).catch(error => {
            res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Error while creating plant" });
        });
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Please provide the good params" });
    }
});

/**
 * @api {post} /populate Peupler la collection de plantes
 * @apiGroup Plants
 * @apiName PopulatePlants
 * @apiDescription Peuple la collection de plantes avec des exemples de noms de plantes.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object} plants Liste des noms de plantes ajoutés.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 201 Created
 * {
 *   "message": "Populate success",
 *   "plants": [
 *     "Aloe Vera", "Bambou", "Bonsai", "Cactus", "Caladium", "Daffodil", "Dahlia", "Fougère",
 *     "Hibiscus", "Jasmin", "Lavande", "Marguerite", "Nénuphar", "Orchidée", "Origan", "Pivoine",
 *     "Primevère", "Quinoa", "Radis", "Rose", "Sauge", "Thym", "Tulipe", "Umbrella Tree",
 *     "Verveine", "Wisteria", "Xanadu Plant", "Yarrow", "Zinnia"
 *   ]
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Accès non autorisé
 * HTTP/1.1 403 Forbidden
 * {
 *   "message": "Unauthorized access"
 * }
 */
router.post('/populate', async (req, res, next) => {
    const { uid, isAdmin } = getUid(req);
    if (isAdmin) {

        await Plant.deleteMany();

        const plantNames = [
            'Rose', 'Tulipe', 'Lavande', 'Orchidée', 'Pivoine', 'Bambou', 'Cactus', 'Dahlia',
            'Fougère', 'Hibiscus', 'Jasmin', 'Marguerite', 'Nénuphar', 'Origan', 'Primevère',
            'Quinoa', 'Radis', 'Sauge', 'Thym', 'Umbrella Tree', 'Verveine', 'Wisteria',
            'Xanadu Plant', 'Yarrow', 'Zinnia', 'Aloe Vera', 'Bonsai', 'Caladium', 'Daffodil',
        ];

        plantNames.sort();

        for (const p of plantNames) {
            await Plant.create({
                name: p,
                ownerId: uid
            }).then(createdPlant => {
                console.info('plant created');
            }).catch(error => {
                console.error('error while creating plant');
            });
        }
        res.status(HttpStatusCodes.CREATED).json({ message: "Populate success", plants: plantNames });

    } else {
        res.status(HttpStatusCodes.FORBIDDEN).json({ message: "Unauthorized access" });
    }
});

/**
 * @api {get} /delete/:id Supprimer une plante
 * @apiGroup Plants
 * @apiName DeletePlant
 * @apiDescription Supprime une plante spécifiée par son identifiant.
 *
 * @apiParam {String} id Identifiant unique de la plante à supprimer.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiSuccess {String} message Message de succès.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Plant deleted successfully"
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Accès non autorisé
 * HTTP/1.1 403 Forbidden
 * {
 *   "message": "Unauthorized access"
 * }
 *
 * @apiErrorExample {json} Erreur - Plant not found
 * HTTP/1.1 404 Not Found
 * {
 *   "message": "Plant not found"
 * }
 *
 * @apiErrorExample {json} Erreur - Erreur de suppression
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Error while deleting plant"
 * }
 */
router.get('/delete/:id', async (req, res, next) => {
    const { uid, isAdmin } = getUid(req);

    if (isAdmin) {
        await Plant.findByIdAndDelete(req.params.id);
        res.status(HttpStatusCodes.OK).json({ message: "Plant deleted successfully" });
    } else {
        res.status(HttpStatusCodes.FORBIDDEN).json({ message: "Unauthorized access" });
    }
});


router.put('/update/:id', async (req, res, next) => {
    const { uid, isAdmin } = getUid(req);
    const plantId = req.params.id;
    const { newName } = req.body;

    if (isAdmin) {
        try {
            // Recherchez la plante par ID
            const plantToUpdate = await Plant.findById(plantId);

            if (!plantToUpdate) {
                return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Plant not found" });
            }

            // Mettez à jour le nom de la plante avec le nouveau nom
            plantToUpdate.name = newName;

            // Enregistrez les modifications dans la base de données
            await plantToUpdate.save();

            res.status(HttpStatusCodes.OK).json({ message: "Plant updated successfully" });
        } catch (error) {
            // Gérez les erreurs de manière appropriée ici
            console.error(error);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        }
    } else {
        res.status(HttpStatusCodes.FORBIDDEN).json({ message: "Unauthorized access" });
    }
});

/**
 * @api {get} /plants/:id Récupérer une plante par son ID
 * @apiGroup Plants
 * @apiName GetPlantById
 * @apiDescription Récupère une plante en fonction de son identifiant.
 * @apiPermission authenticated
 *
 * @apiParam {String} id Identifiant unique de la plante.
 *
 * @apiSuccess {String} _id Identifiant unique de la plante.
 * @apiSuccess {String} name Nom de la plante.
 * @apiSuccess {String} ownerId Identifiant de l'utilisateur propriétaire de la plante.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "_id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *   "name": "Rose",
 *   "ownerId": "123456789"
 * }
 */
router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const plant = await Plant.findById(id).exec();

        if (!plant) {
            return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Plant not found" });
        }

        res.status(HttpStatusCodes.OK).json(plant);
    } catch (err) {
        console.error('Error fetching plant by ID', err);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

export const getPlantName = async (id) => {
    const plant = await Plant.findById(id);
    return plant ? `${plant.name}` : '';
};


export default router;