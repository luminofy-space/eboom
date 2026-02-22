import express from 'express';
const router = express.Router();

import auth from '../middleware/auth';
import canvas from './canvas';
import authRoutes from './auth';
import currency from './currency';
import income from './income';
import incomeCategories from "./income-categories";
import wallets from './wallets';
import expenses from './expenses';

// Auth routes (no authentication required)
router.use('/auth', authRoutes);

// Canvas routes (includes all canvas-scoped routes: canvases, expenses, income-resources, wallets)
router.use('/canvases', auth, canvas);

// Currency routes
router.use('/currency', auth, currency);

// Income routes (resources, transactions, categories)
router.use('/income', auth, income);
router.use("/income/categories", auth, incomeCategories);

// Wallet routes (individual wallet operations)
router.use('/wallets', auth, wallets);

// Expense routes (individual expense operations)
router.use('/expenses', auth, expenses);

export default router;