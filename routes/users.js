import express from 'express';
import { User } from '../models/user.js';
import { getUid, getUser, verifyField } from './auth.js';
import { HttpStatusCodes } from "./http/httpstatuscode.js";

const router = express.Router();

/**
 * @api {get} / Liste des utilisateurs
 * @apiGroup Users
 * @apiName GetUsersList
 * @apiDescription Récupère la liste des utilisateurs (réservé aux administrateurs).
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object[]} users Liste des utilisateurs.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "Users fetched successfully",
 *   "users": [
 *     { "firstname": "John", "lastname": "Doe", "email": "john.doe@example.com" },
 *     { "firstname": "Jane", "lastname": "Smith", "email": "jane.smith@example.com" },
 *     // ...
 *   ]
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Accès non autorisé
 * HTTP/1.1 401 Unauthorized
 * {
 *   "message": "Unauthorized access"
 * }
 */
router.get('/', async (req, res, next) => {

  const { isAdmin } = getUid(req);

  if (isAdmin) {
    const users = await User.find();
    return res.status(HttpStatusCodes.OK).json({ message: "Users fetched successfully", users });
  } else {
    return res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "Unauthorized access" });
  }
});

/**
 * @api {get} /getName/:id Récupérer le nom d'un utilisateur par son identifiant
 * @apiGroup Users
 * @apiName GetUserNameById
 * @apiDescription Récupère le nom d'un utilisateur spécifié par son identifiant.
 *
 * @apiParam {String} id Identifiant unique de l'utilisateur.
 *
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {String} name Nom complet de l'utilisateur.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "User name fetched successfully",
 *   "name": "John Doe"
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Utilisateur non trouvé
 * HTTP/1.1 404 Not Found
 * {
 *   "message": "User not found"
 * }
 *
 * @apiErrorExample {json} Erreur - Paramètre manquant
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Please provide a valid user id"
 * }
 */
router.get('/getName/:id', async (req, res) => {
  const userId = req.params.id;
  if (verifyField(userId)) {
    User.findById(userId, (err, user) => {
      if (err) {
        return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "User not found" });
      } else {
        res.status(HttpStatusCodes.OK).send({ message: 'User name fetched successfully', name: `${user.firstname} ${user.lastname}` });
      }
    });
  } else {
    res.status(HttpStatusCodes.OK).send({ message: 'Please provide a id' });
  }
});

/**
 * @api {post} /delete Supprimer un utilisateur
 * @apiGroup Users
 * @apiName DeleteUser
 * @apiDescription Supprime un utilisateur spécifié par son identifiant.
 *
 * @apiParam {String} id Identifiant unique de l'utilisateur à supprimer.
 *
 * @apiSuccess {String} message Message de succès.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "User deleted successfully"
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Paramètres incorrects
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Please provide the correct parameters"
 * }
 *
 * @apiErrorExample {json} Erreur - Erreur de suppression
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Error while deleting user"
 * }
 */
router.post('/delete', async (req, res, next) => {
  const { id } = req.body;

  if (id == undefined) {
    res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Please provide the good params' });
  }

  try {
    await User.findByIdAndDelete(id);
    res.status(HttpStatusCodes.OK).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Error while deleting user' });
  }
});

/**
 * @api {get} /profile/:id Profil utilisateur par identifiant
 * @apiGroup Users
 * @apiName GetUserProfileById
 * @apiDescription Récupère le profil d'un utilisateur spécifié par son identifiant.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiParam {String} id Identifiant unique de l'utilisateur.
 *
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object} user Informations sur l'utilisateur.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "User fetched successfully",
 *   "user": {
 *     "firstname": "John",
 *     "lastname": "Doe",
 *     "email": "john.doe@example.com",
 *     // ...
 *   }
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Accès non autorisé
 * HTTP/1.1 401 Unauthorized
 * {
 *   "message": "You are not authorized to perform this action"
 * }
 *
 * @apiErrorExample {json} Erreur - Utilisateur non trouvé
 * HTTP/1.1 404 Not Found
 * {
 *   "message": "User not found"
 * }
 */
router.get('/profile/:id', async (req, res) => {
  const { isAdmin } = getUid(req);
  if (isAdmin) {
    User.findById(req.params.id, (err, user) => {
      if (err) {
        res.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Error while getting user' });

      } else {
        res.status(HttpStatusCodes.OK).json({ message: 'User fetched successfully', user: user });
      }
    });
  } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: 'You are not authorized to perform this action' });
  }
});

/**
 * @api {post} /profile/:id Mettre à jour le profil d'un utilisateur par identifiant
 * @apiGroup Users
 * @apiName UpdateUserProfileById
 * @apiDescription Met à jour les informations du profil d'un utilisateur spécifié par son identifiant.
 *
 * @apiHeader {String} Authorization Jeton d'authentification JWT dans le format "Bearer token".
 *
 * @apiParam {String} id Identifiant unique de l'utilisateur.
 * @apiParam {String} firstname Prénom mis à jour de l'utilisateur.
 * @apiParam {String} lastname Nom mis à jour de l'utilisateur.
 * @apiParam {String} email Adresse e-mail mise à jour de l'utilisateur.
 *
 * @apiSuccess {String} message Message de succès.
 * @apiSuccess {Object} user Informations sur l'utilisateur mis à jour.
 *
 * @apiSuccessExample {json} Succès
 * HTTP/1.1 200 OK
 * {
 *   "message": "User updated successfully",
 *   "user": {
 *     "firstname": "John",
 *     "lastname": "Doe",
 *     "email": "john.doe@example.com",
 *     // ...
 *   }
 * }
 *
 * @apiError {String} message Message d'erreur en cas d'échec.
 * @apiErrorExample {json} Erreur - Accès non autorisé
 * HTTP/1.1 401 Unauthorized
 * {
 *   "message": "You are not authorized to perform this action"
 * }
 *
 * @apiErrorExample {json} Erreur - Erreur lors de la mise à jour du profil
 * HTTP/1.1 400 Bad Request
 * {
 *   "message": "Error while updating user profile"
 * }
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

      const updatedUser = getUser(req.params.id);

      res.status(HttpStatusCodes.OK).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Error while updating user profile' });
    }
  } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: 'You are not authorized to perform this action' });
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
    //res.render('unauthorized');
  }
}

export default router;
