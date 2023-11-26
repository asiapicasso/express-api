import mongoose from "mongoose";
import { broadcastMessage } from "../ws.js";

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
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    ownerId: String
}), 'plants');

