import mongoose from "mongoose";

/**
 * @typedef {Object} Plant
 * @property {string} id - Identifiant de la plante
 * @property {string} name - Nom de la plante
 * @property {string} ownerId - Nom de la plante
 */

/**
 * Modèle de l'utilisateur.
 * @type {mongoose.Model<Plant>}
 */
export const Plant = mongoose.model('Plant', mongoose.Schema({
    id: String,
    name: String,
    ownerId: String
}), 'plants');