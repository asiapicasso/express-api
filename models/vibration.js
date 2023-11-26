import mongoose from "mongoose";

/**
 * @typedef {Object} Vibration
 * @property {mongoose.Types.ObjectId} id - Identifiant de la vibration
 * @property {string} name - Nom de la vibration
 * @property {Object} location - Emplacement de la vibration
 * @property {number} location.lat - Latitude de l'emplacement
 * @property {number} location.long - Longitude de l'emplacement
 * @property {string} plantsIds - Identifiants des plantes liées à la vibration
 * @property {string} ownerId - Identifiant du propriétaire de la vibration
 */

/**
 * Modèle de vibration pour l'environnement de production.
 * @type {mongoose.Model<Vibration>}
 */
export const Vibration = mongoose.model('Vibration', mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    location: {
        lat: Number,
        long: Number
    },
    plantsIds: String,
    ownerId: String
}), 'vibrations');

/**
 * Modèle de vibration pour les tests.
 * @type {mongoose.Model<Vibration>}
 */
export const VibrationTest = mongoose.model('VibrationTest', mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    location: {
        lat: Number,
        long: Number
    },
    plantsIds: String,
    ownerId: String
}), 'testVibrations');
