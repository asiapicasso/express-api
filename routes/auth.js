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

// state-of-art des algo de signature, avantage majeur -> déterministe donc pas de problème dans la randomness.
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
 *
 * @apiError {String} 401 Non autorisé - Le token JWT est manquant ou invalide.
 * @apiErrorExample {json} Erreur d'authentification
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Non autorisé - Le token JWT est manquant ou invalide."
 *     }
 */
router.get('/login', (req, res) => {
    res.render('login');
});

/**
 * @api {post} /auth/login Connexion
 * @apiGroup Authentification
 * @apiName Login
 *
 * @apiBody {String} email Adresse e-mail de l'utilisateur
 * @apiBody {String} password Mot de passe de l'utilisateur
 *
 * @apiSuccess {String} token Token JWT pour l'authentification
 * @apiSuccess {Object} user Objet utilisateur
 * @apiSuccess {String} user._id Identifiant de l'utilisateur
 * @apiSuccess {String} user.username Nom complet de l'utilisateur
 * @apiSuccess {String} user.email Adresse e-mail de l'utilisateur
 * @apiSuccess {String} user.role Rôle de l'utilisateur (par défaut: "user")
 * @apiSuccessExample {json} Réussite
 *    HTTP/1.1 200 OK
 *    {
 *      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
 *      "user": {
 *        "_id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *        "username": "John Doe",
 *        "email": "john@doe.com",
 *        "role": "user"
 *      }
 *    }
 *
 * @apiError {String} error Message d'erreur en cas d'échec de l'authentification
 * @apiErrorExample {json} Erreur
 *    HTTP/1.1 401 Unauthorized
 *    {
 *      "error": "Email ou mot de passe incorrect"
 *    }
 */
router.post("/login", async (req, res, next) => {
    // todo handle password and email -> then create the jwt linked to the account, by default status is reader
    const { email, password } = req.body;
    if (verifyField(email) && verifyField(password)) {
        // Votre logique d'authentification ici
        const user = await User.findOne({ email: email });


        if (user && await compare(password, user.password)) {
            //console.log("uid: ", user.id);

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
 * @apiHeader {String} Authorization Token d'authentification valide.
 *
 * @apiSuccess {HTML} Page d'inscription HTML.
 * @apiSuccessExample {HTML} Success
 *     HTTP/1.1 200 OK
 *     <html>
 *       <!-- Contenu de la page d'inscription -->
 *     </html>
 *
 * @apiError {String} 401 Unauthorized - L'utilisateur n'est pas authentifié.
 * @apiErrorExample {JSON} Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Unauthorized",
 *       "message": "Invalid or missing authentication token."
 *     }
 *
 * @apiError {String} 500 Internal Server Error - Erreur interne du serveur.
 * @apiErrorExample {JSON} InternalServerError
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error",
 *       "message": "An unexpected error occurred."
 *     }
 */
router.get('/signup', (req, res, next) => {
    res.render('signup');
});

/**
 * @api {post} /auth/signup Inscrire un nouvel utilisateur
 * @apiGroup Auth
 * @apiName SignUp
 *
 * @apiBody {String} firstname Prénom de l'utilisateur.
 * @apiBody {String} lastname Nom de famille de l'utilisateur.
 * @apiBody {String} email Adresse e-mail de l'utilisateur.
 * @apiBody {String} password Mot de passe de l'utilisateur.
 *
 * @apiSuccess {String} status Statut de la requête (ok ou error).
 * @apiSuccess {String} message Message associé au statut.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "ok",
 *       "message": "Utilisateur créé avec succès."
 *     }
 *
 * @apiError {String} status Statut de la requête (error).
 * @apiError {String} message Message associé au statut.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": "error",
 *       "message": "Des champs requis sont manquants."
 *     }
 */
router.post("/signup", async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body;

    const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

    if (verifyField(firstname) && verifyField(lastname) && verifyField(email) && emailRegex.test(email) && verifyField(password)) {
        // hash the password from the user
        const hashed = await hash(password, saltRounds);


        const createdUser = await User.create({
            email: email,
            password: hashed,
            lastname: lastname,
            firstname: firstname
        }).then(createdUser => {
            // after compute lets indicate the user that the user is created
            //console.info('user created');
            //res.send({ "status": "ok", "message": "user created" });


            const token = generateAccessToken(createdUser.id, isAdmin(email));
            res.cookie('auth', token, COOKIE_HEADER);
            res.status(HttpStatusCodes.CREATED).json({ message: "User created successfully" });
            res.redirect('/');
            /*             notifyRootOnUserSignup(this); // send a websocket to the root user
             */
            /*             broadcastMessage(this);
             */
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

router.get('/profile', (req, res) => {
    res.render('my_profile'); // Assurez-vous que req.user est correctement défini
});

router.post('/profile', async (req, res) => {
    const { uid } = getUid(req);
    try {
        await User.findByIdAndUpdate(uid, {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email
        });

        res.redirect('/auth/profile');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
    }
});

router.post('/delete/:id', deleteMyAccount);

/**
 * @api {get} /auth/logout Déconnexion
 * @apiGroup Auth
 * @apiName Logout
 *
 * @apiDescription Effectue la déconnexion de l'utilisateur en invalidant le token d'authentification.
 *
 * @apiSuccess {String} message Message indiquant le succès de la déconnexion.
 * @apiSuccessExample {json} Succès
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Déconnexion réussie."
 *     }
 *
 * @apiError {String} message Message indiquant l'échec de la déconnexion.
 * @apiErrorExample {json} Erreur
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "L'utilisateur n'est pas authentifié."
 *     }
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
        //console.log('pathhhhhh:', req.path);
        if (!unauthenticated_routes.includes(req.path)) {
            //console.log('ok');
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
                //console.log(user);
                const { uid } = getUid(req);
                res.locals.authUser = await getUser(uid);
                //console.log(res.user);
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

async function getUser(uid) {
    try {
        // Utilisez la méthode findOne de Mongoose pour trouver un utilisateur par son UID
        const user = await User.findById(uid).select('-password');

        // Vérifiez si un utilisateur a été trouvé
        if (user) {
            //console.log('Utilisateur trouvé:', user);
            return user;
        } else {
            //console.log('Aucun utilisateur trouvé pour cet UID.');
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la recherche de l\'utilisateur:', error);
        throw error; // Vous pouvez choisir de gérer l'erreur différemment selon vos besoins
    }
}

export default router;

