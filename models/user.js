import mongoose from "mongoose";

/**
 * @typedef {Object} User
 * @property {string} firstname - Le prénom de l'utilisateur.
 * @property {string} lastname - Le nom de l'utilisateur.
 * @property {string} email - L'adresse e-mail de l'utilisateur.
 * @property {string} password - Le mot de passe de l'utilisateur.
 */

/**
 * Modèle de l'utilisateur.
 * @type {mongoose.Model<User>}
 */
export const User = mongoose.model('User', mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    password: String
}), 'users');


