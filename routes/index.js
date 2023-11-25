import express from 'express';
import { authenticateToken } from './auth.js';
import { broadcastMessage } from '../ws.js';

const router = express.Router();

router.get('/', authenticateToken, function (req, res, next) {
  res.render('home');

  broadcastMessage('Welcome !');
});


export default router;
