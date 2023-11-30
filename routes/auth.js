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
 * @apiGroup Authentication
 * @apiName AfficherLoginPage
 * @apiDescription Renvoie la page de connexion.
 * @apiHeader {String} Authorization JWT Token de l'utilisateur (doit être connecté).
 *
 * @apiSuccess {HTML} Page HTML de connexion
 * @apiSuccessExample {html} Succès
 *     HTTP/1.1 200 OK
 *     Page HTML de connexion
 */
router.get('/login', (req, res) => {
    res.render('login');
});

/**
 * @api {post} /login User Login
 * @apiName UserLogin
 * @apiGroup Authentication
 * @apiDescription Logs in a user and generates an access token.

 * @apiBody {String} email User's email address.
 * @apiBody {String} password User's password.

 * @apiSuccess {Number} status HTTP status code (200 for success).
 * @apiSuccess {String} message Success message.
 * @apiSuccess {String} token Generated access token.

 * @apiError {Number} status HTTP status code (400 for bad request).
 * @apiError {String} message Error message.

 * @apiErrorExample {json} Error Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": 400,
 *       "message": "Email/password incorrect"
 *     }

 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 200,
 *       "message": "Login success",
 *       "token": "eyJhbGciOiJIUzI1NiIsIn..."
 *     }
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
 * @apiGroup Authentication
 * @apiName AfficherInscription
 *
 * @apiSuccess {HTML} Page d'inscription HTML.
 * @apiSuccessExample {HTML} Success
 *     HTTP/1.1 200 OK
 *     <html>
 *       <!-- Contenu de la page d'inscription -->
 *     </html>
 */
router.get('/signup', (req, res, next) => {
    res.render('signup');
});

/**
 * @api {post} /signup Create a new user
 * @apiName CreateUser
 * @apiGroup Users
 * @apiDescription Creates a new user account with the provided information.

 * @apiBody {String} firstname User's first name.
 * @apiBody {String} lastname User's last name.
 * @apiBody {String} email User's email address.
 * @apiBody {String} password User's password.

 * @apiSuccess {Number} status HTTP status code (201 for success).
 * @apiSuccess {String} message Success message.

 * @apiError {Number} status HTTP status code (400 for bad request, 409 for conflict).
 * @apiError {String} message Error message.

 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "status": 201,
 *       "message": "User created successfully"
 *     }
 *
 * @apiErrorExample {json} Bad Request Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": 400,
 *       "message": "Something is missing"
 *     }
 *
 * @apiErrorExample {json} Conflict Response:
 *     HTTP/1.1 409 Conflict
 *     {
 *       "status": 409,
 *       "message": "Error while creating account"
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

            //notifyRootOnUserSignup(this); // send a websocket to the root user
            //broadcastMessage(this);

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
 * @api {get} /profile Get user's profile
 * @apiName GetUserProfile
 * @apiGroup Users
 * @apiDescription Fetches and renders the user's profile page.

 * @apiHeader {String} Cookie User's authentication cookie.

 * @apiSuccess {Number} status HTTP status code (200 for success).
 * @apiSuccess {String} message Success message.
 * @apiSuccess {String} view Rendered HTML view of the user's profile.

 * @apiError {Number} status HTTP status code (401 for unauthorized).
 * @apiError {String} message Error message.

 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 200,
 *       "message": "User profile fetched successfully",
 *       "view": "<html>...</html>"
 *     }
 *
 * @apiErrorExample {json} Unauthorized Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "status": 401,
 *       "message": "Unauthorized. Please log in."
 *     }
 */
/* router.get('/profile', (req, res) => {
    // Assurez-vous que req.user est correctement défini dans votre middleware d'authentification
    if (req.isAuthenticated()) {
        res.status(HttpStatusCodes.OK).json({
            status: HttpStatusCodes.OK,
            message: "User profile fetched successfully",
            view: 'my_profile.ejs', // Contenu de la vue
        });
        //res.render('my_profile'); // Rend la vue sur le serveur
    } else {
        res.status(HttpStatusCodes.UNAUTHORIZED).json({
            status: HttpStatusCodes.UNAUTHORIZED,
            message: "Unauthorized. Please log in.",
        });
    }
}); */

router.get('/profile', (req, res) => {
    res.render('my_profile');
});

/**
 * @api {post} /profile Update user profile
 * @apiName UpdateUserProfile
 * @apiGroup Users
 * @apiDescription Updates the profile information of the authenticated user.

 * @apiHeader {String} Authorization User's access token.

 * @apiBody {String} firstname User's first name.
 * @apiBody {String} lastname User's last name.
 * @apiBody {String} email User's email address.

 * @apiSuccess {Number} status HTTP status code (302 for redirection).
 * @apiSuccess {String} message Success message.
 * @apiSuccess {String} location Redirect location.

 * @apiError {Number} status HTTP status code (400 for bad request, 401 for unauthorized).
 * @apiError {String} message Error message.

 * @apiErrorExample {json} Error Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": 400,
 *       "message": "Invalid request. Please provide valid user data."
 *     }
 *
 * @apiErrorExample {json} Unauthorized Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "status": 401,
 *       "message": "Unauthorized. Please provide a valid access token."
 *     }
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 302 Found
 *     {
 *       "status": 302,
 *       "message": "Profile updated successfully",
 *       "location": "/auth/profile"
 *     }
 */
router.post('/profile', async (req, res) => {
    const { uid } = getUid(req);
    try {
        await User.findByIdAndUpdate(uid, {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email
        });

        /* res.status(HttpStatusCodes.OK).json({
            status: HttpStatusCodes.OK, message: "Profile updated successfully"
        }); */

        res.redirect('/auth/profile');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Invalid request. Please provide valid user data." });
    }
});

/**
 * @api {post} /delete/:id Delete User Account
 * @apiName DeleteUserAccount
 * @apiGroup Users
 * @apiDescription Deletes the user account with the specified ID.

 * @apiHeader {String} Authorization User's access token.

 * @apiParam {String} id User's unique ID.

 * @apiSuccess {Number} status HTTP status code (200 for success).
 * @apiSuccess {String} message Success message.

 * @apiError {Number} status HTTP status code (400 for bad request, 401 for unauthorized).
 * @apiError {String} message Error message.

 * @apiErrorExample {json} Error Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": 400,
 *       "message": "Invalid user ID"
 *     }
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 200,
 *       "message": "User account deleted successfully"
 *     }
 *
 * @apiErrorExample {json} Unauthorized Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "status": 401,
 *       "message": "Unauthorized. Please provide a valid access token."
 *     }
 */
router.post('/delete/:id', deleteMyAccount);

/**
 * @api {get} /logout Logout user
 * @apiName LogoutUser
 * @apiGroup Authentication
 * @apiDescription Logs out the authenticated user and invalidates the authentication token.

 * @apiHeader {String} Cookie User's authentication token in the form of a cookie (auth).

 * @apiSuccess {Number} status HTTP status code (200 for success).
 * @apiSuccess {String} message Success message.

 * @apiError {Number} status HTTP status code (400 for bad request).
 * @apiError {String} message Error message.

 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 200,
 *       "message": "Logged out successfully"
 *     }
 *
 * @apiErrorExample {json} Unauthorized Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "status": 401,
 *       "message": "Unauthorized. Please log in."
 *     }
 *
 * @apiErrorExample {json} Bad Request Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": 400,
 *       "message": "Error while logging out"
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

