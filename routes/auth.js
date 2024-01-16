import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { hash, compare } from "bcrypt";
import { deleteMyAccount } from "./users.js";
import { HttpStatusCodes } from "./http/httpstatuscode.js";
//import { notifyRootOnUserSignup, broadcastMessage } from "../ws.js";

const saltRounds = 10;
const blacklisted_token = [];
const unauthenticated_routes = ['/auth/login', '/auth/signup'];

// state-of-art des algos de signature, avantage majeur -> déterministe donc pas de problème dans la randomness.
// évite utilisation de seed avec mauvaise entropie (qualité de la seed tirée)
const jwtOptions = { algorithm: 'EdDSA' };

const router = express.Router();

/**
 * @api {get} /auth/login Afficher la page de connexion
 * @apiGroup Auth
 * @apiName AfficherLoginPage
 * @apiDescription Renvoie la page de connexion.
 * @apiHeader {String} Authorization JWT Token de l'utilisateur (doit être connecté).
 *
 * @apiSuccess {HTML} Page HTML de connexion
 * @apiSuccessExample {html} Succès
 *     HTTP/1.1 200 OK
 *     Page HTML de connexion
 */
/* router.get('/login', (req, res) => {
    res.render('login');
}); */

/**
 * @api {post} /login Connexion utilisateur
 * @apiGroup Users
 * @apiName UserLogin
 * @apiDescription Connecte un utilisateur avec son adresse e-mail et son mot de passe.
 *
 * @apiParam {String} email Adresse e-mail de l'utilisateur.
 * @apiParam {String} password Mot de passe de l'utilisateur.
 *
 * @apiSuccess {String} message Message de succès.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Login success"
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Email/mot de passe incorrect
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Email/password incorrect"
 * }
 */
router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;
    if (verifyField(email) && verifyField(password)) {
        // Votre logique d'authentification ici
        const user = await User.findOne({ email: email });

        if (user && await compare(password, user.password)) {

            const token = generateAccessToken(user.id, isAdmin(email));
            res.cookie('auth', token, COOKIE_HEADER);
            res.status(HttpStatusCodes.OK).json({ message: "Login success" });
            res.redirect('/');
            next();
        } else {
            res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Email/password incorrect" });
        }
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Email/password incorrect" });
    }
});

/**
 * @api {get} /auth/signup Afficher la page d'inscription
 * @apiGroup Auth
 * @apiName AfficherInscription
 *
 * @apiSuccess {HTML} Page d'inscription HTML.
 * @apiSuccessExample {HTML} Success
 *     HTTP/1.1 200 OK
 *     <html>
 *       <!-- Contenu de la page d'inscription -->
 *     </html>
 */
/* router.get('/signup', (req, res, next) => {
    res.render('signup');
}); */


/**
 * @api {post} /signup Inscription utilisateur
 * @apiGroup Users
 * @apiName UserSignup
 * @apiDescription Inscrit un nouvel utilisateur avec les informations fournies.
 *
 * @apiParam {String} firstname Prénom de l'utilisateur.
 * @apiParam {String} lastname Nom de l'utilisateur.
 * @apiParam {String} email Adresse e-mail de l'utilisateur (doit être au format valide).
 * @apiParam {String} password Mot de passe de l'utilisateur.
 *
 * @apiSuccess {String} message Message de succès.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 201 Created
 * {
 *   "message": "User created successfully"
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Informations manquantes
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Something is missing"
 * }
 *
 * @apiErrorExample {json} Erreur - Format d'e-mail invalide
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Invalid email format"
 * }
 *
 * @apiErrorExample {json} Erreur - Erreur de création de compte
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Error while creating account"
 * }
 */
router.post("/signup", async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body;

    const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

    if (verifyField(firstname) && verifyField(lastname) && verifyField(email) && emailRegex.test(email) && verifyField(password)) {
        // hash the password from the user
        const hashed = await hash(password, saltRounds);

        await User.create({
            email: email,
            password: hashed,
            lastname: lastname,
            firstname: firstname
        }).then(createdUser => {
            // after compute lets indicate the user that the user is created
            console.info('user created');
            //res.send({ "status": "ok", "message": "user created" });

            const token = generateAccessToken(createdUser.id, isAdmin(email));
            res.cookie('auth', token, COOKIE_HEADER)
                .status(HttpStatusCodes.CREATED)   /*                .json({ message: "User created successfully" })
             .redirect('/');  */
            /*  notifyRootOnUserSignup(this); // send a websocket to the root user  */
            /*  broadcastMessage(this); */
        }).catch(error => {
            console.error('error while creating user');
            //res.send({ "status": "error", "message": `something went wrong when creating account ${error}` });
            res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Error while creating account" });

        });
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Something is missing" });
        //res.send({ "status": "error", "message": "something is missing" });
    }
});


/**
 * @api {post} /profile Mettre à jour le profil utilisateur
 * @apiGroup Users
 * @apiName UpdateUserProfile
 * @apiDescription Met à jour les informations du profil de l'utilisateur.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiParam {String} firstname Prénom mis à jour de l'utilisateur.
 * @apiParam {String} lastname Nom mis à jour de l'utilisateur.
 * @apiParam {String} email Adresse e-mail mise à jour de l'utilisateur.
 *
 * @apiSuccess {String} message Message de succès.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Profile updated successfully"
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Invalid request. Please provide valid user data."
 * }
 */
router.post('/profile', async (req, res) => {
    const { uid } = getUid(req);
    try {
        await User.findByIdAndUpdate(uid, {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email
        });

        res.status(HttpStatusCodes.OK).json({ message: "Profile updated successfully" });

        //res.redirect('/auth/profile');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Invalid request. Please provide valid user data." });
    }
});

/**
 * @api {post} /delete/:id Supprimer un compte utilisateur
 * @apiGroup Users
 * @apiName DeleteUserAccount
 * @apiDescription Supprime le compte utilisateur spécifié par son identifiant.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiParam {String} id Identifiant unique du compte utilisateur à supprimer.
 *
 * @apiSuccess {String} message Message de succès.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "User account deleted successfully"
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Accès non autorisé
 * HTTP/1.1 401 Unauthorized
 * {
 *   "message": "You are not authorized to perform this action"
 * }
 *
 * @apiErrorExample {json} Erreur - Erreur de suppression
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "message": "Error while deleting user account"
 * }
 */
router.post('/delete/:id', deleteMyAccount);

/**
 * @api {get} /logout Déconnexion utilisateur
 * @apiGroup Users
 * @apiName UserLogout
 * @apiDescription Déconnecte l'utilisateur en invalidant le jeton d'authentification.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiSuccess {String} message Message de succès.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Logged out successfully"
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Erreur lors de la déconnexion
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Error while logging out"
 * }
 */
router.get('/logout', (req, res, next) => {
    const token = req.cookies.auth;
    if (token && !blacklisted_token.includes(token)) {
        blacklisted_token.push(token);
        res.clearCookie('auth');
        res.status(HttpStatusCodes.OK).json({ message: "Logged out successfully" });
        res.redirect('/auth/login');
    } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Error while logging out" });
        res.redirect('/auth/login');
    }
});

/**
 * Vérifie l'authentification de l'utilisateur via JWT
 * @param {Request} req 
 * @param {Response} res 
 * @param {import("express").NextFunction} next 
 * @returns Droit de continuer ou 401 Unauthorized
 */
export function handleAuth(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.auth;
    const authRejected = () => {
        res.locals.isLogged = false;
        if (!unauthenticated_routes.includes(req.path)) {
            console.log(req.path);
            res.redirect('/auth/login');
        }
        next();
    }

    if (verifyField(token)) {
        jwt.verify(token, process.env.JWT_SECRET, jwtOptions, async (err, user) => {
            if (err) {
                console.error(err);
                authRejected();
            } else {
                const { uid } = getUid(req);
                res.locals.authUser = await getUser(uid);
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
export function generateAccessToken(uid, isAdmin = false) {
    return jwt.sign({ uid: uid, isAdmin: isAdmin }, process.env.JWT_SECRET);
}


/**
 * httpOnly: empêche Javascrip client-side d'accéder à ce cookie de session, et donc bloque les attaques XSS.
 * secure: permet d'autoriser l'utilisation de ce cookie qu'en HTTPS.
 * strict: n'autorise la transmission de ce cookie que sur le même Origin.
 * */
const COOKIE_HEADER = { httpOnly: true, secure: true, sameSite: 'Strict' };


export const verifyField = (field) => {
    return field != undefined && field != null && field != '';
}


export function isAdmin(email) {
    return verifyField(email) && email === process.env.ROOT_ADMIN;
}

export async function getUser(uid) {
    try {
        const user = await User.findById(uid);

        if (user) {
            return user;
        } else {
            return undefined;
        }
    } catch (error) {
        console.error('Error while fetching user', error);
    }
}

export default router;

