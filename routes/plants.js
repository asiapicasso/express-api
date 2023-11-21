import express from "express";
import { Plant } from "../models/plant.js";
import { hash, compare } from "bcrypt";
import { authenticateToken, getUid } from "./auth.js";
const router = express.Router();


router.get('/my', authenticateToken, async (req, res, next) => {
    const ownerId = getUid(req);

    try {
        const plants = await Plant.find({ ownerId: ownerId });
        res.render('my_plants', { plants });
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
    const ownerId = getUid(req);

    console.log(name, ownerId);
    if (name != undefined && ownerId != undefined) {
        const createdPlant = await Plant.create({
            name: name,
            ownerId: ownerId
        }).then(createdPlant => {
            console.info('plant created');
            window.location.href = '/my';
        }).catch(error => {
            console.error('error while creating user');
            res.send({ "status": "error", "message": `something went wrong when creating account ${error}` });

        });
    } else {
        res.send({ "status": "error", "message": "something is missing" });
    }
});


export default router;