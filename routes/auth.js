import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { hash, compare } from "bcrypt";


const saltRounds = 10;
const blacklisted_token = [];

// state-of-art des algo de signature, avantage majeur -> déterministe donc pas de problème dans la randomness.
// évite utilisation de seed avec mauvaise entropie (qualité de la seed tirée)
const jwtOptions = { algorithm: 'EdDSA' };


const router = express.Router();

router.get('/login', authenticateToken, (req, res) => {
    res.render('login');
});

router.post("/login", async (req, res, next) => {
    // todo handle password and email -> then create the jwt linked to the account, by default status is reader
    const { email, password } = req.body;
    if (verifyField(email) && verifyField(password)) {
        // Votre logique d'authentification ici
        const user = await User.findOne({ email: email });


        if (user && await compare(password, user.password)) {
            console.log("uid: ", user.id);

            const token = generateAccessToken(user.id, isAdmin(email));
            res.cookie('auth', token, COOKIE_HEADER);
            res.redirect('/');
            next();
        } else {
            res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }


    } else {
        res.status(400).json({ error: "Email et mot de passe requis" });
    }
});


router.get('/sign_up', authenticateToken, (req, res, next) => {
    res.render('sign_up');
});

router.post("/sign_up", async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body;

    console.info('issue');

    if (verifyField(firstname) && verifyField(lastname) && verifyField(email) && verifyField(password)) {

        // hash the password from the user
        const hashed = await hash(password, saltRounds);


        const createdUser = await User.create({
            email: email,
            password: hashed,
            lastname: lastname,
            firstname: firstname
        }).then(createdUser => {
            // after compute lets indicate the user that the user is created
            console.info('user created');
            //res.send({ "status": "ok", "message": "user created" });
            const token = generateAccessToken(createdUser.id, isAdmin(email));
            res.cookie('auth', token, COOKIE_HEADER);
            res.redirect('/');
        }).catch(error => {
            console.error('error while creating user');
            res.send({ "status": "error", "message": `something went wrong when creating account ${error}` });

        });
    } else {
        res.send({ "status": "error", "message": "something is missing" });
    }
});

/**
 * Vérifie l'authentification de l'utilisateur
 * @param {Request} req 
 * @param {Response} res 
 * @param {import("express").NextFunction} next 
 * @returns Droit de continuer ou 401 Unauthorized
 */
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.auth;

    const authRejected = () => {
        res.locals.isLogged = false;
        console.log(req.path);
        if (req.path !== '/login' && req.path !== '/sign_up') {
            console.log('ok');
            res.redirect('/auth/login');
        }
        next();
    }

    if (verifyField(token)) {
        jwt.verify(token, process.env.JWT_SECRET, jwtOptions, (err, user) => {
            if (err) {
                console.error(err);
                authRejected();
            } else {
                console.log(user);

                res.locals.isAdmin = user.isAdmin;
                res.locals.isLogged = true;
            };
            next();
        })
    } else {
        authRejected();
    }
}

router.get('/logout', (req, res, next) => {
    const token = req.cookies.auth;
    if (token && !blacklisted_token.includes(token)) {
        blacklisted_token.push(token);
        res.clearCookie('auth');
        res.redirect('/auth/login');
    } else {
        res.redirect('/auth/login');
    }
});


/**
 * Renvoie l'UID de l'utilisateur sur la base de son cookie de session
 * @param {Request} req 
 * @returns uid ou undefined
 */
export function getUid(req) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.auth;
    return jwt.verify(token, process.env.JWT_SECRET, jwtOptions);
}

/**
 * Génère un cookie de session pour accéder à l'API
 * @param {String} uid identifiant mongo de l'utilisateur
 * @returns 
 */
function generateAccessToken(uid, isAdmin = false) {
    return jwt.sign({ uid: uid, isAdmin: isAdmin }, process.env.JWT_SECRET);
}


/**
 * httpOnly: empêche Javascrip client-side d'accéder à ce cookie de session, et donc bloque les attaques XSS.
 * secure: permet d'autoriser l'utilisation de ce cookie qu'en HTTPS.
 * strict: n'autorise la transmission de ce cookie que sur le même Origin.
 * */
const COOKIE_HEADER = { httpOnly: true, secure: true, sameSite: 'Strict' };


export const verifyField = (field) => {
    console.error('processed field: ', field);
    return field != undefined && field != null && field != '';
}


function isAdmin(email) {
    return verifyField(email) && email === process.env.ROOT_ADMIN;
}

export default router;

