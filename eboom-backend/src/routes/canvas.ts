import express from 'express';
import canvasRoutes from './canvas/canvas';
import expenseRoutes from './canvas/expenses';
import incomeResourceRoutes from './canvas/income-resources';
import walletRoutes from './canvas/wallets';

const router = express.Router();

router.use('/', canvasRoutes);
router.use('/:canvasId/expenses', expenseRoutes);
router.use('/:canvasId/income-resources', incomeResourceRoutes);
router.use('/:canvasId/wallets', walletRoutes);

export default router;
