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
import assetCategories from './asset-categories';
import assets from './assets';
import canvasMembersRouter from './canvas-members';
import canvasInvitationsRouter from './canvas-invitations';
import canvasRolesRouter from './canvas-roles';
import whiteboardRouter from './whiteboard';
import calendarRouter from './calendar';
import notificationsRouter from './notifications';
import transfersRouter from './transfers';
import budgetsRouter from './budgets';
import savingsGoalsRouter from './savings-goals';
import aiInsightProfilesRouter from './ai-insight-profiles';
import aiInsightsRouter from './ai-insights';
import aiChatRouter from './ai-chat';

// Auth routes (no authentication required)
router.use('/auth', authRoutes);

// Canvas-scoped entity routes
router.use('/canvases/:canvasId/members', auth, canvasMembersRouter);
router.use('/canvases/:canvasId/whiteboard', auth, whiteboardRouter);
router.use('/canvases/:canvasId/budgets', auth, budgetsRouter);
router.use('/canvases/:canvasId/savings-goals', auth, savingsGoalsRouter);
router.use('/canvases/:canvasId/ai-insight-profile', auth, aiInsightProfilesRouter);
router.use('/canvases/:canvasId/ai-insights', auth, aiInsightsRouter);
router.use('/canvases/:canvasId/ai-chat', auth, aiChatRouter);
router.use('/canvases/:canvasId/expenses', auth, expenses);
router.use('/canvases/:canvasId/incomes', auth, income);
router.use('/canvases/:canvasId/wallets', auth, wallets);
router.use('/canvases/:canvasId/assets', auth, assets);
router.use('/canvases/:canvasId/transfers', auth, transfersRouter);
router.use('/canvases', auth, canvas);

// Canvas invitations
router.use('/canvas-invitations', auth, canvasInvitationsRouter);

// Canvas roles
router.use('/roles/canvas', auth, canvasRolesRouter);

// Currency routes
router.use('/currency', auth, currency);

// Income categories (not canvas-scoped)
router.use("/income/categories", auth, incomeCategories);

// Category routes (not canvas-scoped)
router.use('/wallet/categories', auth, walletCategories)
router.use('/expense/categories', auth, expenseCategories);
router.use('/asset/categories', auth, assetCategories);

// Calendar routes
router.use('/calendar', auth, calendarRouter);

// Notifications
router.use('/notifications', auth, notificationsRouter);

export default router;
