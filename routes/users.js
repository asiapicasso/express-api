import express from 'express';
import { User } from '../models/user.js';
import { hash, compare } from 'bcrypt';
import { authenticateToken } from './auth.js';
const router = express.Router();

/**
 * @api {get} /users Liste des utilisateurs
 * @apiGroup Users
 * @apiName GetUsers
 *
 * @apiDescription Récupère la liste de tous les utilisateurs.
 *
 * @apiHeader {String} Authorization Jeton JWT d'authentification dans le format "Bearer {token}".
 *
 * @apiSuccess {Object[]} users Liste des utilisateurs.
 * @apiSuccess {String} users._id Identifiant unique de l'utilisateur.
 * @apiSuccess {String} users.firstname Prénom de l'utilisateur.
 * @apiSuccess {String} users.lastname Nom de l'utilisateur.
 * @apiSuccess {String} users.email Adresse e-mail de l'utilisateur.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * [
 *   {
 *     "_id": "id_utilisateur_1",
 *     "firstname": "Prénom1",
 *     "lastname": "Nom1",
 *     "email": "utilisateur1@example.com"
 *   },
 *   {
 *     "_id": "id_utilisateur_2",
 *     "firstname": "Prénom2",
 *     "lastname": "Nom2",
 *     "email": "utilisateur2@example.com"
 *   },
 *   // ...
 * ]
 *
 * @apiErrorExample {json} Erreur d'authentification
 * HTTP/1.1 401 Unauthorized
 * {
 *   "error": "Unauthorized"
 * }
 *
 * @apiErrorExample {json} Erreur serveur
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "error": "Internal Server Error"
 * }
 */
router.get('/', authenticateToken, async (req, res, next) => {
  const users = await User.find();
  res.render('users', { users });
});

/**
 * @api {get} /user/getName/:id Récupérer le nom de l'utilisateur
 * @apiGroup Utilisateur
 * @apiName GetUserName
 *
 * @apiParam {String} id Identifiant de l'utilisateur.
 *
 * @apiSuccess {String} name Nom complet de l'utilisateur.
 *
 * @apiSuccessExample {json} Réponse réussie
 * HTTP/1.1 200 OK
 * John Doe
 *
 * @apiError {String} message Message d'erreur.
 * @apiErrorExample {json} Utilisateur non trouvé
 * HTTP/1.1 404 Not Found
 * Utilisateur non trouvé
 *
 * @apiErrorExample {json} Erreur interne du serveur
 * HTTP/1.1 500 Internal Server Error
 * Erreur interne du serveur
 */
router.get('/getName/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('Utilisateur non trouvé');
    }

    res.send(`${user.firstname} ${user.lastname}`);
  } catch (error) {
    console.error('Erreur lors de la récupération du nom de l\'utilisateur :', error);
    res.status(500).send('Erreur interne du serveur');
  }
});

//TODO
router.get('/read', authenticateToken, (req, res, next) => {
  //TODO read user id from body and display it from mangdb
});

//TODO
//acces au compte c'est le ownUser && Admin
router.post('/update', authenticateToken, async function (req, res, next) {
  //TODO update the user from user id in body
  const { id } = req.body;

  if (id == undefined) {
    res.send({ 'status': 'error', 'message': 'please provide the good params' });
  }

  // TODO verify that only user owner can update his profile


  // i set toto for exemple but you can change everything you want.
  // you must check in the req body which param you want to allow the user to update and then set it in the updateOne function
  try {
    await User.updateOne({ _id: 'id' }, { firstname: 'toto' });

  } catch (error) {
    res.send({ 'status': 'error', 'message': 'error while updating user' });
  }
});

/**
 * @api {post} /delete Supprimer un utilisateur
 * @apiGroup Utilisateur
 * @apiName SupprimerUtilisateur
 * @apiPermission authenticated
 *
 * @apiParam {String} id Identifiant de l'utilisateur à supprimer.
 *
 * @apiSuccess {String} status Statut de la requête (success ou error).
 * @apiSuccess {String} message Message décrivant le résultat de la requête.
 *
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 *   "status": "success",
 *   "message": "utilisateur supprimé avec succès"
 * }
 *
 * @apiError {String} status Statut de la requête (error).
 * @apiError {String} message Message décrivant l'erreur.
 *
 * @apiErrorExample {json} Error
 * HTTP/1.1 200 OK
 * {
 *   "status": "error",
 *   "message": "erreur lors de la suppression de l'utilisateur"
 * }
 */
router.post('/delete', authenticateToken, async (req, res, next) => {

  const { id } = req.body;
  // TODO verify that only user owner can delete his profile

  if (id == undefined) {
    res.send({ 'status': 'error', 'message': 'please provide the good params' });

  }

  try {

    await User.findByIdAndDelete(id);
    res.send({ 'status': 'success', 'message': 'user successfully deleted' });
  } catch (error) {
    res.send({ 'status': 'error', 'message': 'error while deleting user' });
  }
});


export const getUserName = async (ownerId) => {
  const user = await User.findById(ownerId);
  return user ? `${user.firstname} ${user.lastname}` : '';
};

export default router;
