import express from 'express';
const router = express.Router();

import auth from '../middleware/auth';
import canvas from './canvas';
import authRoutes from './auth';
import currency from './currency';
import income from './income';

router.use('/auth', authRoutes);

router.use('/canvases', auth, canvas);

router.use('/currency', auth, currency);//TODOOOOO: ADD auth MIDDLEWARE HERE 

router.use('/income', auth, income)//TODOOOOO: ADD auth MIDDLEWARE HERE 

export default router;