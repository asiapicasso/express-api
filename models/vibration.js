
import mongoose from "mongoose";
export const Vibration = mongoose.model('Vibration', mongoose.Schema({
    name: String,
    location: String,
    familyId: String,
    ownerId: String
}), 'vibrations');
