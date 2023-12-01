import mongoose from 'mongoose';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { PlantTest } from './models/plant.js';
import { User, UserTest } from './models/user.js';
import { VibrationTest } from './models/vibration.js';
import { port } from './bin/start.js';

chai.use(chaiHttp);
const { expect } = chai;
import dotenv from 'dotenv';
import { generateAccessToken } from './routes/auth.js';
import { HttpStatusCodes } from './routes/http/httpstatuscode.js';

dotenv.config();


describe('Model Tests', () => {
    const testPlantModel = PlantTest;
    const testVibrationModel = VibrationTest;
    const testUserModel = UserTest;

    before((done) => {
        mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'Erreur de connexion à la base de données :'));
        db.once('open', () => {
            console.log('Connexion à la base de données réussie');
            done();
        });
    });

    after(async () => {
        try {
            UserTest.deleteMany();
            PlantTest.deleteMany();
            VibrationTest.deleteMany();
        } catch (error) {
            console.error('Erreur lors de la suppression des documents :', error);
        } finally {
            mongoose.connection.close(true);
            console.log('Déconnexion de la base de données réussie');
        }
    });

    it('should create a new plant', (done) => {
        const newPlant = {
            name: 'Nom de la plante',
            ownerId: 'ownerId',
        };

        testPlantModel.create(newPlant).then((plant) => {
            expect(plant).to.have.property('_id');
            expect(plant.name).to.equal(newPlant.name);
            expect(plant.ownerId).to.equal(newPlant.ownerId);
            done();
        });
    });

    it('should update a plant', async () => {
        const newPlantData = {
            name: 'Nom de la plante',
            ownerId: 'ownerId',
        };

        const createdPlant = await testPlantModel.create(newPlantData);

        const updatedPlantData = {
            name: 'Nouveau nom de la plante',
        };

        const updatedPlant = await testPlantModel.findByIdAndUpdate(
            createdPlant._id,
            updatedPlantData,
            { new: true }
        );

        expect(updatedPlant).to.have.property('_id');
        expect(updatedPlant.name).to.equal(updatedPlantData.name);
        expect(updatedPlant.ownerId).to.equal(newPlantData.ownerId);
    });

    it('should delete a plant', async () => {
        const newPlantData = {
            name: 'Nom de la plante',
            ownerId: 'ownerId',
        };

        const createdPlant = await testPlantModel.create(newPlantData);

        const deletedPlant = await testPlantModel.findOneAndDelete({ _id: createdPlant._id });

        expect(deletedPlant).to.have.property('_id');
    });

    it('should create a new user', async () => {
        const newUser = {
            firstname: 'John',
            lastname: 'Doe',
            email: 'john.doe@example.com',
            password: 'password123',
        };

        const createdUser = await testUserModel.create(newUser);

        expect(createdUser).to.have.property('_id');
        expect(createdUser.firstname).to.equal(newUser.firstname);
        expect(createdUser.lastname).to.equal(newUser.lastname);
        expect(createdUser.email).to.equal(newUser.email);
    });

    it('should update a user', async () => {
        const newUserData = {
            firstname: 'John',
            lastname: 'Doe',
            email: 'john.doe@example.com',
            password: 'password123',
        };

        const createdUser = await testUserModel.create(newUserData);

        const updatedUserData = {
            firstname: 'Updated John',
            lastname: 'Updated Doe',
            email: 'updated.john.doe@example.com',
        };

        const updatedUser = await testUserModel.findByIdAndUpdate(
            createdUser._id,
            updatedUserData,
            { new: true }
        );

        expect(updatedUser).to.have.property('_id');
        expect(updatedUser.firstname).to.equal(updatedUserData.firstname);
        expect(updatedUser.lastname).to.equal(updatedUserData.lastname);
        expect(updatedUser.email).to.equal(updatedUserData.email);
    });

    it('should delete a user', async () => {
        const newUserData = {
            firstname: 'John',
            lastname: 'Doe',
            email: 'john.doe@example.com',
            password: 'password123',
        };

        const createdUser = await testUserModel.create(newUserData);

        const deletedUser = await testUserModel.findOneAndDelete({ _id: createdUser._id });

        expect(deletedUser).to.have.property('_id');
    });

    it('should create a new vibration', async () => {
        const newVibration = {
            name: 'testVibrationModel Test',
            location: { lat: 12.345, long: 45.678 },
            plantsIds: 'plant1,plant2',
            ownerId: 'ownerId',
        };

        const createdVibration = await testVibrationModel.create(newVibration);

        expect(createdVibration).to.have.property('_id');
        expect(createdVibration.name).to.equal(newVibration.name);
        expect(createdVibration.location.lat).to.equal(createdVibration.location.lat);
        expect(createdVibration.location.long).to.equal(createdVibration.location.long);
        expect(createdVibration.plantsIds).to.equal(newVibration.plantsIds);
        expect(createdVibration.ownerId).to.equal(newVibration.ownerId);
    });

    it('should update a vibration', async () => {
        const newVibrationData = {
            name: 'testVibrationModel Test',
            location: { lat: 12.345, long: 45.678 },
            plantsIds: 'plant1,plant2',
            ownerId: 'ownerId',
        };

        const createdVibration = await testVibrationModel.create(newVibrationData);

        const updatedVibrationData = {
            name: 'Updated testVibrationModel',
            location: { lat: 23.456, long: 56.789 },
        };

        const updatedVibration = await testVibrationModel.findByIdAndUpdate(
            createdVibration._id,
            updatedVibrationData,
            { new: true }
        );

        expect(updatedVibration).to.have.property('_id');
        expect(updatedVibration.name).to.equal(updatedVibrationData.name);
        expect(updatedVibration.location.lat).to.equal(updatedVibrationData.location.lat);
        expect(updatedVibration.location.long).to.equal(updatedVibrationData.location.long);

        expect(updatedVibration.plantsIds).to.equal(createdVibration.plantsIds);
        expect(updatedVibration.ownerId).to.equal(createdVibration.ownerId);
    });

    it('should delete a vibration', async () => {
        const newVibrationData = {
            name: 'testVibrationModel Test',
            location: { lat: 12.345, long: 45.678 },
            plantsIds: 'plant1,plant2',
            ownerId: 'ownerId',
        };

        const createdVibration = await testVibrationModel.create(newVibrationData);

        const deletedVibration = await testVibrationModel.findOneAndDelete({ _id: createdVibration._id });

        expect(deletedVibration).to.have.property('_id');
    });

    it('should populate plants via API (admin only)', (done) => {

        const token = generateAccessToken('adminId', true);

        chai.request(`localhost:${port}`)  // Replace 'your_api_base_url' with the actual base URL of your API
            .post('/plants/populate')
            .set('Cookie', `auth=${token}`)
            .end((err, res) => {
                expect(res).to.have.status(HttpStatusCodes.CREATED);
                expect(res.body).to.have.property('message').equal('Populate success');
                done();
            });
    });

    /* it('should not populate plants via API (regular user)', (done) => {

        chai.request(`localhost:${port}`)  // Replace 'your_api_base_url' with the actual base URL of your API
            .post('/plants/populate')
            .end((err, res) => {
                expect(res).to.have.status(HttpStatusCodes.FORBIDDEN);
                expect(res.body).to.have.property('message').equal('Unauthorized access');
                done();
            });
    }); */
});
