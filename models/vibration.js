import mongoose from "mongoose";
export const Vibration = mongoose.model('Vibration', mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    location: String,
    plantIds: String,
    ownerId: String
}), 'vibrations');
