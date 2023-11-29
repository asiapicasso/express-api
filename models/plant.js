import mongoose from "mongoose";

/**
 * @typedef {Object} Plant
 * @property {string} id - Identifiant de la plante
 * @property {string} name - Nom de la plante
 * @property {string} ownerId - Nom de la plante
 */

/**
 * Modèle de Plante.
 * @type {mongoose.Model<Plant>}
 */
export const Plant = mongoose.model('Plant', mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    ownerId: String
}), 'plants');

/**
* Modèle de Plante pour les tests.
* @type {mongoose.Model<Plant>}
*/
export const PlantTest = mongoose.model('PlantTest', mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    ownerId: String
}), 'testPlants');



