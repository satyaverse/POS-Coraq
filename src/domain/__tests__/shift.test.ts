import {
  fixtureCashDrawerExpense,
  fixturePaidCashOrder,
  fixtureShift,
  makeOrder,
} from './fixtures';
import { calculateShiftSummary } from '../shift';

describe('calculateShiftSummary', () => {
  it('returns zero summary when there is no active shift', () => {
    const summary = calculateShiftSummary({
      activeShift: null,
      orders: [fixturePaidCashOrder],
      expenses: [fixtureCashDrawerExpense],
    });

    expect(summary).toEqual({
      startCash: 0,
      cashSales: 0,
      nonCashSales: 0,
      debt: 0,
      expenses: 0,
      expectedCash: 0,
    });
  });

  it('includes paid cash orders after shift start only', () => {
    const summary = calculateShiftSummary({
      activeShift: fixtureShift,
      orders: [
        makeOrder({
          id: 'cash-after-start',
          finalAmount: 25000,
          paymentStatus: 'PAID',
          paymentMethod: 'CASH',
          paidAt: '2026-06-27T09:00:00.000Z',
        }),
        makeOrder({
          id: 'cash-before-start',
          finalAmount: 99999,
          paymentStatus: 'PAID',
          paymentMethod: 'CASH',
          paidAt: '2026-06-27T07:59:59.000Z',
        }),
      ],
      expenses: [],
    });

    expect(summary.cashSales).toBe(25000);
  });

  it('includes paid QRIS and DEBIT orders as non-cash sales after shift start', () => {
    const summary = calculateShiftSummary({
      activeShift: fixtureShift,
      orders: [
        makeOrder({
          id: 'qris-after-start',
          finalAmount: 30000,
          paymentStatus: 'PAID',
          paymentMethod: 'QRIS',
          paidAt: '2026-06-27T09:00:00.000Z',
        }),
        makeOrder({
          id: 'debit-after-start',
          finalAmount: 40000,
          paymentStatus: 'PAID',
          paymentMethod: 'DEBIT',
          paidAt: '2026-06-27T09:10:00.000Z',
        }),
        makeOrder({
          id: 'qris-before-start',
          finalAmount: 99999,
          paymentStatus: 'PAID',
          paymentMethod: 'QRIS',
          paidAt: '2026-06-27T07:59:59.000Z',
        }),
      ],
      expenses: [],
    });

    expect(summary.nonCashSales).toBe(70000);
  });

  it('includes unpaid debt orders created after shift start', () => {
    const summary = calculateShiftSummary({
      activeShift: fixtureShift,
      orders: [
        makeOrder({
          id: 'debt-after-start',
          finalAmount: 43000,
          paymentStatus: 'UNPAID',
          paymentMethod: 'DEBT',
          createdAt: '2026-06-27T09:00:00.000Z',
          paidAt: undefined,
        }),
        makeOrder({
          id: 'debt-before-start',
          finalAmount: 99999,
          paymentStatus: 'UNPAID',
          paymentMethod: 'DEBT',
          createdAt: '2026-06-27T07:59:59.000Z',
          paidAt: undefined,
        }),
      ],
      expenses: [],
    });

    expect(summary.debt).toBe(43000);
  });

  it('includes only non-voided cash drawer expenses after shift start', () => {
    const summary = calculateShiftSummary({
      activeShift: fixtureShift,
      orders: [],
      expenses: [
        fixtureCashDrawerExpense,
        {
          ...fixtureCashDrawerExpense,
          id: 'transfer-expense',
          amount: 99999,
          source: 'TRANSFER',
        },
        {
          ...fixtureCashDrawerExpense,
          id: 'voided-cash-expense',
          amount: 99999,
          isVoided: true,
        },
        {
          ...fixtureCashDrawerExpense,
          id: 'before-shift-expense',
          amount: 99999,
          date: '2026-06-27T07:59:59.000Z',
        },
      ],
    });

    expect(summary.expenses).toBe(25000);
  });

  it('calculates expected cash from start cash, cash sales, and cash expenses', () => {
    const summary = calculateShiftSummary({
      activeShift: fixtureShift,
      orders: [
        makeOrder({
          id: 'cash-after-start',
          finalAmount: 100000,
          paymentStatus: 'PAID',
          paymentMethod: 'CASH',
          paidAt: '2026-06-27T09:00:00.000Z',
        }),
        makeOrder({
          id: 'qris-after-start',
          finalAmount: 30000,
          paymentStatus: 'PAID',
          paymentMethod: 'QRIS',
          paidAt: '2026-06-27T09:00:00.000Z',
        }),
      ],
      expenses: [fixtureCashDrawerExpense],
    });

    expect(summary).toMatchObject({
      startCash: 500000,
      cashSales: 100000,
      nonCashSales: 30000,
      expenses: 25000,
      expectedCash: 575000,
    });
  });
});
