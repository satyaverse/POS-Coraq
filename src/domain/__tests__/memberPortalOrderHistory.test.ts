import { OrderStatus } from '../../../types';
import { fixtureBronzeMember, makeOrder } from './fixtures';
import { getMemberOrderHistory } from '../memberPortalOrderHistory';

describe('member portal order history', () => {
  it('returns completed member orders sorted by createdAt with finalAmount values', () => {
    const olderOrder = makeOrder({
      id: 'older-order',
      memberId: fixtureBronzeMember.id,
      status: OrderStatus.COMPLETED,
      createdAt: '2026-06-27T08:00:00.000Z',
      finalAmount: 25000,
    });
    const newerOrder = makeOrder({
      id: 'newer-order',
      memberId: fixtureBronzeMember.id,
      status: OrderStatus.COMPLETED,
      createdAt: '2026-06-27T10:00:00.000Z',
      finalAmount: 43000,
    });
    const otherMemberOrder = makeOrder({
      id: 'other-member-order',
      memberId: 'other-member',
      status: OrderStatus.COMPLETED,
      createdAt: '2026-06-27T11:00:00.000Z',
      finalAmount: 99000,
    });
    const preparingOrder = makeOrder({
      id: 'preparing-order',
      memberId: fixtureBronzeMember.id,
      status: OrderStatus.PREPARING,
      createdAt: '2026-06-27T12:00:00.000Z',
      finalAmount: 120000,
    });

    const history = getMemberOrderHistory(
      [olderOrder, newerOrder, otherMemberOrder, preparingOrder],
      fixtureBronzeMember.id,
    );

    expect(history.map(order => order.id)).toEqual(['newer-order', 'older-order']);
    expect(history.map(order => order.createdAt)).toEqual([
      '2026-06-27T10:00:00.000Z',
      '2026-06-27T08:00:00.000Z',
    ]);
    expect(history.map(order => order.finalAmount)).toEqual([43000, 25000]);
  });
});
