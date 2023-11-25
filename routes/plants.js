import express from "express";
import { Plant } from "../models/plant.js";
import { hash, compare } from "bcrypt";
import { authenticateToken, getUid, verifyField } from "./auth.js";
import { Vibration } from "../models/vibration.js";
const router = express.Router();


router.get('/my', authenticateToken, async (req, res, next) => {
    const ownerId = getUid(req);
    try {
        if (verifyField(ownerId)) {
            const plants = await Plant.find({ ownerId: ownerId }).catch((err) => {
                console.error("error while fetching: ", err);
            }) || [];


            res.render('my_plants', { plants });
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
    const ownerId = getUid(req);

    if (verifyField(name) && verifyField(ownerId)) {
        const createdPlant = await Plant.create({
            name: name,
            ownerId: ownerId
        }).then(createdPlant => {
            console.info('plant created');
            res.redirect('/plants/my');
        }).catch(error => {
            console.error('error while creating plant');
            res.send({ "status": "error", "message": `something went wrong when creating plant ${error}` });

        });
    } else {
        res.send({ "status": "error", "message": "something is missing" });
    }
});


router.get('/delete/:id', authenticateToken, (req, res, next) => {
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


export default router;