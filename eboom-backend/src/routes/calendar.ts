import express, { Request, Response } from 'express';
import { db } from '../db/client';
import { and, eq, gte, lte, or } from 'drizzle-orm';
import { expenses, incomeResources } from '../db/schema';
import authMiddleware from '../middleware/auth';
import { RRule } from 'rrule';

const router = express.Router();

const parseRecurrencePattern = (pattern: any, startDate: Date) => {
  if (!pattern) return null;

  const ruleOptions: any = {
    dtstart: startDate,
  };

  if (pattern.frequency) {
    switch (pattern.frequency.toLowerCase()) {
      case 'daily':
        ruleOptions.freq = RRule.DAILY;
        break;
      case 'weekly':
        ruleOptions.freq = RRule.WEEKLY;
        if (pattern.byday) {
          ruleOptions.byweekday = pattern.byday.map((d: string) => RRule[d.toUpperCase()]);
        }
        break;
      case 'monthly':
        ruleOptions.freq = RRule.MONTHLY;
        if (pattern.bymonthday) {
          ruleOptions.bymonthday = pattern.bymonthday;
        }
        break;
      case 'yearly':
        ruleOptions.freq = RRule.YEARLY;
        if (pattern.bymonth) {
          ruleOptions.bymonth = pattern.bymonth;
        }
        break;
    }
  }

  if (pattern.interval) {
    ruleOptions.interval = pattern.interval;
  }

  if (pattern.until) {
    ruleOptions.until = new Date(pattern.until);
  }

  return new RRule(ruleOptions);
};

router.get('/:canvasId/calendar', authMiddleware, async (req: Request, res: Response) => {
  const { canvasId } = req.params;
  const { startDate, endDate } = req.query;
  const user = req.appUser;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const recurringIncomes = await db
      .select()
      .from(incomeResources)
      .where(and(eq(incomeResources.canvasId, parseInt(canvasId)), eq(incomeResources.isRecurring, true)));

    const recurringExpenses = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.canvasId, parseInt(canvasId)), eq(expenses.isRecurring, true)));

    const nonRecurringIncomes = await db
      .select()
      .from(incomeResources)
      .where(
        and(
          eq(incomeResources.canvasId, parseInt(canvasId)),
          eq(incomeResources.isRecurring, false),
          gte(incomeResources.createdAt, start),
          lte(incomeResources.createdAt, end)
        )
      );

    const nonRecurringExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.canvasId, parseInt(canvasId)),
          eq(expenses.isRecurring, false),
          gte(expenses.createdAt, start),
          lte(expenses.createdAt, end)
        )
      );

    const events: { [key: string]: any[] } = {};

    const addEvent = (date: Date, event: any) => {
      const dateString = date.toISOString().split('T')[0];
      if (!events[dateString]) {
        events[dateString] = [];
      }
      events[dateString].push(event);
    };

    recurringIncomes.forEach((income) => {
      const rule = parseRecurrencePattern(income.recurrencePattern, income.createdAt);
      if (rule) {
        rule.between(start, end).forEach((date) => {
          addEvent(date, { ...income, type: 'income' });
        });
      }
    });

    recurringExpenses.forEach((expense) => {
      const rule = parseRecurrencePattern(expense.recurrencePattern, expense.createdAt);
      if (rule) {
        rule.between(start, end).forEach((date) => {
          addEvent(date, { ...expense, type: 'expense' });
        });
      }
    });

    nonRecurringIncomes.forEach((income) => {
      addEvent(income.createdAt, { ...income, type: 'income' });
    });

    nonRecurringExpenses.forEach((expense) => {
      addEvent(expense.createdAt, { ...expense, type: 'expense' });
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
