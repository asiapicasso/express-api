import express from "express";
import { Plant } from "../models/plant.js";
import { hash, compare } from "bcrypt";
import { authenticateToken, getUid, verifyField } from "./auth.js";
const router = express.Router();


router.get('/my', authenticateToken, async (req, res, next) => {
    const { uid } = getUid(req);

    try {
        if (verifyField(uid)) {
            const plants = await Plant.find({ ownerId: uid }).catch((err) => {
                console.error("error while fetching: ", err);
            }) || [];

            res.render('my_plants', { plants });
        } else {
            console.error('owner id must be provided');
        }

    } catch (error) {
        console.error('Error fetching your plants:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/create', authenticateToken, (req, res, next) => {
    res.render('new_plant');
});

router.post("/create", async (req, res, next) => {
    const { name } = req.body;
    const { uid, isAdmin } = getUid(req);

    if (verifyField(name) && verifyField(uid) && isAdmin) {
        const createdPlant = await Plant.create({
            name: name,
            ownerId: uid
        }).then(createdPlant => {
            console.info('plant created');
            res.redirect('/plants/my');
        }).catch(error => {
            console.error('error while creating plant');
            res.send({ "status": "error", "message": `something went wrong when creating plant ${error}` });

        });
    } else {
        res.send({ "status": "error", "message": "something is missing or you are not admin" });
    }
});


router.post('/populate', authenticateToken, async (req, res, next) => {
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
    }
    res.redirect('/plants/my');
});


router.get('/delete/:id', authenticateToken, (req, res, next) => {

    // todo missing verification
    Plant.findByIdAndDelete(req.params.id)
        .then(() => {
            console.log(req.params.id, "deleted");
            res.redirect('/plants/my');
        })
        .catch((err) => {
            console.error(err, "happened");
            res.redirect('/plants/my');
        });
});

export const getPlantName = async (id) => {
    const plant = await Plant.findById(id);
    return plant ? `${plant.name}` : '';
};


export default router;