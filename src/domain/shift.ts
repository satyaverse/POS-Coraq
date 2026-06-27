import { Expense, Order, Shift } from '../../types';

export interface ShiftSummary {
  startCash: number;
  cashSales: number;
  nonCashSales: number;
  debt: number;
  expenses: number;
  expectedCash: number;
}

export function calculateShiftSummary(_input: {
  activeShift: Shift | null;
  orders: Order[];
  expenses: Expense[];
}): ShiftSummary {
  const { activeShift, orders, expenses } = _input;

  if (!activeShift) {
    return {
      startCash: 0,
      cashSales: 0,
      nonCashSales: 0,
      debt: 0,
      expenses: 0,
      expectedCash: 0,
    };
  }

  const startTime = new Date(activeShift.startTime).getTime();

  const cashSales = orders.reduce((sum, order) => {
    if (
      order.paymentStatus === 'PAID' &&
      order.paymentMethod === 'CASH' &&
      order.paidAt &&
      new Date(order.paidAt).getTime() >= startTime
    ) {
      return sum + order.finalAmount;
    }

    return sum;
  }, 0);

  const nonCashSales = orders.reduce((sum, order) => {
    if (
      order.paymentStatus === 'PAID' &&
      (order.paymentMethod === 'QRIS' || order.paymentMethod === 'DEBIT') &&
      order.paidAt &&
      new Date(order.paidAt).getTime() >= startTime
    ) {
      return sum + order.finalAmount;
    }

    return sum;
  }, 0);

  const debt = orders.reduce((sum, order) => {
    if (
      order.paymentStatus === 'UNPAID' &&
      new Date(order.createdAt).getTime() >= startTime
    ) {
      return sum + order.finalAmount;
    }

    return sum;
  }, 0);

  const totalExpenses = expenses.reduce((sum, expense) => {
    if (
      new Date(expense.date).getTime() >= startTime &&
      expense.source === 'CASH_DRAWER' &&
      !expense.isVoided
    ) {
      return sum + expense.amount;
    }

    return sum;
  }, 0);

  return {
    startCash: activeShift.startCash,
    cashSales,
    nonCashSales,
    debt,
    expenses: totalExpenses,
    expectedCash: activeShift.startCash + cashSales - totalExpenses,
  };
}
