import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { hash, compare } from "bcrypt";
//import { notifyRootOnUserSignup, broadcastMessage } from "../ws.js";

const saltRounds = 10;
const blacklisted_token = [];

// state-of-art des algo de signature, avantage majeur -> déterministe donc pas de problème dans la randomness.
// évite utilisation de seed avec mauvaise entropie (qualité de la seed tirée)
const jwtOptions = { algorithm: 'EdDSA' };


const router = express.Router();


/**
 * @api {get} /auth/login Afficher la page de connexion
 * @api {middleware} /middlewares/authenticateToken Authenticate Token
 * @apiGroup Auth
 * @apiName GetLogin
 */
router.get('/login', authenticateToken, (req, res) => {
    res.render('login');
});

/**
 * @api {post} /auth/login Authentifier un utilisateur
 * @apiGroup Auth
 * @apiName PostLogin
 * @apiBody {String} email Email de l'utilisateur
 * @apiBody {String} password Mot de passe de l'utilisateur
 * @apiSuccess {String} token Jeton JWT
 * @apiSuccess {Object} user Informations sur l'utilisateur
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "_id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *     "username": "John Doe",
 *     "email": "john@doe.com",
 *     "_v": 0,
 *     "role": "user"
 *   }
 * }
 */
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

/**
 * @api {get} /auth/sign_up Afficher la page d'inscription
 * @apiGroup Auth
 * @apiName GetSignUp
 * @apiPermission authenticated
 */
router.get('/sign_up', authenticateToken, (req, res, next) => {
    res.render('sign_up');
});

/**
 * @api {post} /auth/sign_up Inscrire un nouvel utilisateur
 * @apiGroup Auth
 * @apiName PostSignUp
 * @apiBody {String} firstname Prénom de l'utilisateur
 * @apiBody {String} lastname Nom de l'utilisateur
 * @apiBody {String} email Email de l'utilisateur
 * @apiBody {String} password Mot de passe de l'utilisateur
 * @apiSuccess {String} token Jeton JWT
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "_id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *     "username": "John Doe",
 *     "email": "john@doe.com",
 *     "_v": 0,
 *     "role": "user"
 *   }
 * }
 */
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
            /*             notifyRootOnUserSignup(this); // send a websocket to the root user
             */
            /*             broadcastMessage(this);
             */
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

/**
 * @api {get} /auth/logout Déconnecter l'utilisateur
 * @apiGroup Auth
 * @apiName GetLogout
 * @apiPermission authenticated
 */
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

