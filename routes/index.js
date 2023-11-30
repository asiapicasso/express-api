import express from 'express';
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
 *       <!-- redirection sur page de log -->
 *     </html>
 */

router.get('/', function (req, res, next) {
  res.render('home');
});

export default router;
