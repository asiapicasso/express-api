import express from "express";
import { Plant } from "../models/plant.js";
import { hash, compare } from "bcrypt";
import { getUid, verifyField } from "./auth.js";
import { HttpStatusCodes } from "./http/httpstatuscode.js";

const router = express.Router();

/**
 * @api {get} /plants/my Liste de mes plantes
 * @apiGroup Plants
 * @apiName GetMyPlants
 * @apiDescription Récupère la liste des plantes appartenant à l'utilisateur connecté.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiSuccess {Object[]} plants Liste des plantes de l'utilisateur.
 * @apiSuccess {String} plants.id Identifiant unique de la plante.
 * @apiSuccess {String} plants.name Nom de la plante.
 * @apiSuccess {String} plants.ownerId Identifiant de l'utilisateur propriétaire de la plante.
 *
 * @apiSuccessExample {json} Réussite
 * HTTP/1.1 200 OK
 * [
 *   {
 *     "id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *     "name": "Rose",
 *     "ownerId": "123456789"
 *   },
 *   {
 *     "id": "5f7b5b0b0b5b5b0b0b5b5b0c",
 *     "name": "Tulipe",
 *     "ownerId": "123456789"
 *   }
 * ]
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
            const plants = await Plant.find({ ownerId: uid }).catch((err) => {
                console.error("error while fetching: ", err);
            }) || [];

            res.status(HttpStatusCodes.OK).json({ message: "Plants fetched successfully", plants });
            res.render('my_plants', { plants });
        } else {
            console.error('owner id must be provided');
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });

        }

    } catch (error) {
        console.error('Error fetching your plants:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
    res.render('new_plant');
});

/**
 * @api {post} /plants/create Create a new plant
 * @apiGroup Plants
 * @apiName CreatePlant
 * @apiDescription Create a new plant with the specified name.
 *
 * @apiBody {String} name Name of the plant.
 *
 * @apiSuccess {String} status Status of the operation ("ok" or "error").
 * @apiSuccess {String} message Operation message.
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "status": "ok",
 *     "message": "Plant created successfully."
 *   }
 *
 * @apiError {String} status Status of the operation ("ok" or "error").
 * @apiError {String} message Error message.
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "status": "error",
 *     "message": "Invalid input or insufficient permissions."
 *   }
 */
router.post("/create", async (req, res, next) => {
    const { name } = req.body;
    const { uid, isAdmin } = getUid(req);

    if (verifyField(name) && verifyField(uid) && isAdmin) {
        const createdPlant = await Plant.create({
            name: name,
            ownerId: uid
        }).then(createdPlant => {
            //console.info('plant created');
            res.status(HttpStatusCodes.CREATED).json({ message: "Plant created successfully", createdPlant });
            res.redirect('/plants/my');
        }).catch(error => {
            //console.error('error while creating plant');
            res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Error while creating plant" });
            res.send({ "status": "error", "message": `something went wrong when creating plant ${error}` });

        });
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Missing params" });
        //res.send({ "status": "error", "message": "something is missing or you are not admin" });
    }
});

/**
 * @api {post} /plants/populate Populate Plants
 * @apiGroup Plants
 * @apiName PopulatePlants
 * @apiDescription Populates the Plants collection with predefined plant names.
 *
 * @apiHeader {String} Authorization User's JWT token.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {String} [error] Error message if applicable.
 *
 * @apiSuccessExample {json} Success
 * HTTP/1.1 302 Found
 * {
 *   "message": "Plants populated successfully."
 * }
 *
 * @apiErrorExample {json} Error
 * HTTP/1.1 401 Unauthorized
 * {
 *   "error": "Unauthorized: Admin access required."
 * }
 *
 * @apiErrorExample {json} Error
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "error": "Error while populating plants."
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
            // Ajoutez d'autres noms au besoin
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
        res.status(HttpStatusCodes.CREATED).json({ message: "Populate success" });

    } else {
        res.status(HttpStatusCodes.FORBIDDEN).json({ message: "Unauthorized access" });
    }
    //res.redirect('/plants/my'); //jsp pour celui la
});

/**
 * @api {get} /plants/delete/:id Supprimer une plante
 * @apiGroup Plants
 * @apiName SupprimerPlante
 * @apiDescription Supprime une plante en fonction de son identifiant.
 * @apiPermission authenticated
 *
 * @apiParam {String} id Identifiant unique de la plante.
 *
 * @apiSuccess {String} message Message indiquant que la plante a été supprimée avec succès.
 * @apiSuccess {String} status Statut de la requête.
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Plante supprimée avec succès",
 *   "status": "success"
 * }
 *
 * @apiError {String} message Message d'erreur indiquant pourquoi la suppression a échoué.
 * @apiError {String} status Statut de la requête.
 * @apiErrorExample {json} Erreur
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "message": "Erreur lors de la suppression de la plante",
 *   "status": "error"
 * }
 */

//copie de code ?
//jsp 
router.get('/delete/:id', (req, res, next) => {

    // todo missing verification
    Plant.findByIdAndDelete(req.params.id)
        .then(() => {
            //console.log(req.params.id, "deleted");
            res.redirect('/plants/my');
        })
        .catch((err) => {
            console.error(err, "happened");
            res.redirect('/plants/my');
        });
    /* if (isAdmin) {
    try {
        await Plant.findByIdAndDelete(req.params.id);
        res.status(HttpStatusCodes.OK).json({ message: "Plant deleted successfully" });
    } catch (err) {
        console.error(err, "Error while deleting plant");
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Error while deleting plant" });
    }
} else {
    res.status(HttpStatusCodes.FORBIDDEN).json({ message: "Unauthorized access" });
} */

});

export const getPlantName = async (id) => {
    const plant = await Plant.findById(id);
    return plant ? `${plant.name}` : '';
};


export default router;