import express from 'express';
import { authenticateToken } from './auth.js';
const router = express.Router();

router.get('/', authenticateToken, function(req, res, next) {
  res.render('home');
});


export default router;
