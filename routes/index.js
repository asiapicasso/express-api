import express from 'express';
import { authenticateToken } from './auth.js';
const router = express.Router();

/**
 * @api {get} / Accueil
 * @apiGroup Accueil
 * @apiName Accueil
 * @apiDescription Affiche la page d'accueil après vérification de l'authentification.
 * @apiHeader {String} Authorization Jeton d'authentification de l'utilisateur (Bearer Token).
 * @apiSuccess {String} render Renvoie la page d'accueil.
 * @apiSuccessExample {html} Page d'accueil
 *     HTTP/1.1 200 OK
 *     <html>
 *       <!-- Contenu de la page d'accueil -->
 *     </html>
 * @apiError (401 Unauthorized) {String} Unauthorized L'utilisateur n'est pas authentifié.
 * @apiErrorExample {json} Erreur d'authentification
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Unauthorized",
 *       "message": "L'utilisateur n'est pas authentifié."
 *     }
 */
router.get('/', authenticateToken, function (req, res, next) {
  res.render('home');
});


export default router;
