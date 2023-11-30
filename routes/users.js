import express from 'express';
import { User } from '../models/user.js';
import { getUid, verifyField } from './auth.js';
import { HttpStatusCodes } from "./http/httpstatuscode.js";

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
router.get('/', async (req, res, next) => {

  const { uid, isAdmin } = getUid(req);

  if (isAdmin) {
    const users = await User.find().select('-password');
    res.send(HttpStatusCodes.OK).json({ message: "Users fetched successfully", users });
    res.render('users', { users });
    ;

  } else {
    res.send(HttpStatusCodes.UNAUTHORIZED).json({ message: "Unauthorized access" });
    res.render('unauthorized');
  }
});

/**
 * @api {get} /user/getName/:id Récupérer le nom de l'utilisateur
 * @apiGroup Users
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
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "User not found" });
      //res.status(404).send('Utilisateur non trouvé');
    }
    res.send(`${user.firstname} ${user.lastname}`);
  } catch (error) {
    //console.error('Erreur lors de la récupération du nom de l\'utilisateur :', error);

    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
  }
});

/**
 * @api {post} /delete Supprimer un utilisateur
 * @apiGroup Users
 * @apiName SupprimerUtilisateur
 * @apiPermission authenticated
 *
 * @apiBody {String} id Identifiant de l'utilisateur à supprimer.
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

//jsp
router.post('/delete', async (req, res, next) => {

  const { id } = req.body;
  // TODO verify that only user owner can delete his profile

  if (id == undefined) {
    res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'please provide the good params' });
    //res.send({ 'status': 'error', 'message': 'please provide the good params' });
  }

  try {

    await User.findByIdAndDelete(id);
    res.status(HttpStatusCodes.OK).json({ message: 'User deleted successfully' });
    //res.send({ 'status': 'success', 'message': 'user successfully deleted' });
  } catch (error) {
    res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Error while delezing user' });
    //res.send({ 'status': 'error', 'message': 'error while deleting user' });
  }

  //if {try catch} else //code manquant
  /* } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: 'You are not authorized to perform this action' });
  } */
});

/**
 * @api {get} /profile/:id Get User Profile
 * @apiGroup Users
 * @apiName GetUserProfile
 * @apiPermission admin
 *
 * @apiParam {String} id User's unique ID.
 *
 * @apiSuccess {Object} user User profile information.
 * @apiSuccess {String} user._id User's unique ID.
 * @apiSuccess {String} user.firstname User's first name.
 * @apiSuccess {String} user.lastname User's last name.
 * @apiSuccess {String} user.email User's email address.
 *
 * @apiSuccessExample {json} Success (Admin):
 *    HTTP/1.1 200 OK
 *    {
 *      "user": {
 *        "_id": "5f7b5b0b0b5b5b0b0b5b5b0b",
 *        "firstname": "John",
 *        "lastname": "Doe",
 *        "email": "john@doe.com"
 *      }
 *    }
 *
 * @apiError (Unauthorized) {String} message You are not authorized to perform this action.
 *
 * @apiErrorExample {json} Unauthorized:
 *    HTTP/1.1 401 Unauthorized
 *    {
 *      "message": "You are not authorized to perform this action"
 *    }
 *
 * @apiErrorExample {json} User Not Found:
 *    HTTP/1.1 404 Not Found
 *    {
 *      "message": "User not found"
 *    }
 */
router.get('/profile/:id', async (req, res) => {
  const { isAdmin } = getUid(req);
  if (isAdmin) {
    const user = await User.findById(req.params.id).select('-password');
    res.status(HttpStatusCodes.OK).json({ user });
    res.render('profile', { user: user });

  } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: 'You are not authorized to perform this action' });
    res.render('unauthorized');
  }

});

/**
 * @api {post} /users/profile/:id Update User Profile
 * @apiGroup Users
 * @apiName UpdateUserProfile
 *
 * @apiParam {String} id User's unique identifier.
 *
 * @apiBody {String} firstname New firstname for the user.
 * @apiBody {String} lastname New lastname for the user.
 * @apiBody {String} email New email for the user.
 *
 * @apiSuccess {String} Redirects to the updated user's profile page.
 *
 * @apiError (Unauthorized 401) {String} message You are not authorized to perform this action.
 * @apiError (Bad Request 400) {String} message Error while updating user profile.
 *
 * @apiDescription
 * Updates the profile of a user with the specified ID. Only administrators are authorized to perform this action.
 *
 * @apiExample {curl} Example usage:
 *   curl -X POST -H "Content-Type: application/json" -d
 *   '{"firstname": "John", "lastname": "Doe", "email": "john.doe@example.com"}'
 *   https://express-api-56k1.onrender.com/users/profile/${id}
 */
router.post('/profile/:id', async (req, res) => {
  const { isAdmin } = getUid(req);

  if (isAdmin) {
    try {
      await User.findByIdAndUpdate(req.params.id, {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email
      });

      res.redirect(`/users/profile/${req.params.id}`);
    } catch (error) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Error while updating user profile' });
      //console.error('Erreur lors de la mise à jour du profil:', error);
    }
  } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: 'You are not authorized to perform this action' });
    res.render('unauthorized');
  }
});

export const getUserName = async (ownerId) => {
  const user = await User.findById(ownerId).select('-password');
  return user ? `${user.firstname} ${user.lastname}` : '';
};

export function deleteMyAccount(req, res, next) {
  const idToDelete = req.params.id;
  const { isAdmin, uid } = getUid(req);
  const deleteMyAccount = uid === idToDelete;
  console.debug('Id to delete :', idToDelete);
  if (verifyField(idToDelete) && (isAdmin || deleteMyAccount)) {
    User.findByIdAndDelete(idToDelete).then(() => {
      if (deleteMyAccount) {
        res.redirect('/auth/logout');
      } else {
        res.redirect('/users');
      }
    }).catch(err => {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error while deleting user' });
      //console.error('error while deleting user');
    });

  } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: 'You are not authorized to perform this action' });
    res.render('unauthorized');
  }
}

export default router;
