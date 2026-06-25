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
import walletCategories from './wallet-categories';
import expenseCategories from './expense-categories';
import canvasMembersRouter from './canvas-members';
import canvasInvitationsRouter from './canvas-invitations';
import canvasRolesRouter from './canvas-roles';
import whiteboardRouter from './whiteboard';
import calendarRouter from './calendar';
import notificationsRouter from './notifications';

// Auth routes (no authentication required)
router.use('/auth', authRoutes);

// Canvas routes (includes canvas-scoped lists: expenses, incomes, wallets)
router.use('/canvases/:canvasId/members', auth, canvasMembersRouter);
router.use('/canvases/:canvasId/whiteboard', auth, whiteboardRouter);
router.use('/canvases', auth, canvas);

// Canvas invitations
router.use('/canvas-invitations', auth, canvasInvitationsRouter);

// Canvas roles
router.use('/roles/canvas', auth, canvasRolesRouter);

// Currency routes
router.use('/currency', auth, currency);

// Income routes (CRUD + entries, categories)
router.use("/income/categories", auth, incomeCategories);
router.use('/income', auth, income);

// Wallet routes (individual wallet operations)
router.use('/wallets', auth, wallets);
router.use('/wallet/categories', auth, walletCategories)

// Expense routes (individual expense operations)
router.use('/expenses', auth, expenses);
router.use('/expense/categories', auth, expenseCategories);

// Calendar routes
router.use('/calendar', auth, calendarRouter);

// Notifications
router.use('/notifications', auth, notificationsRouter);

export default router;
