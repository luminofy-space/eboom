import express from 'express';
const router = express.Router();

import auth from '../middleware/auth';
import canvas from './canvas';
import authRoutes from './auth';

router.use('/auth', authRoutes);

router.use('/canvases', auth, canvas);

export default router;