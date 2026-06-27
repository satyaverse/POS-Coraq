import { OrderStatus, Role } from '../../../types';
import {
  fixtureProducts,
  makeCartItem,
  makeOrder,
} from './fixtures';
import {
  filterOrdersForStation,
  getInitialStationStatuses,
  getItemsForStation,
  getStationForCategory,
  resolveGlobalOrderStatus,
  sortOrdersByDeadline,
} from '../kds';

describe('KDS station routing', () => {
  it('routes drink categories to barista and food categories to kitchen', () => {
    expect(getStationForCategory('COFFEE')).toBe('BARISTA');
    expect(getStationForCategory('NON_COFFEE')).toBe('BARISTA');
    expect(getStationForCategory('FOOD')).toBe('KITCHEN');
    expect(getStationForCategory('DESSERT')).toBe('KITCHEN');
    expect(getStationForCategory('MERCHANDISE')).toBeNull();
  });

  it('returns items relevant to station role', () => {
    const order = makeOrder({
      items: [
        makeCartItem({ tempId: 'drink', product: fixtureProducts.coffee }),
        makeCartItem({ tempId: 'food', product: fixtureProducts.food }),
      ],
    });

    expect(getItemsForStation(order, Role.BARISTA).map(item => item.tempId)).toEqual(['drink']);
    expect(getItemsForStation(order, Role.KITCHEN).map(item => item.tempId)).toEqual(['food']);
  });

  it('activates both stations for mixed cart and idles uninvolved stations', () => {
    expect(
      getInitialStationStatuses([
        makeCartItem({ product: fixtureProducts.coffee }),
        makeCartItem({ product: fixtureProducts.food }),
      ]),
    ).toEqual({ baristaStatus: 'PREPARING', kitchenStatus: 'PREPARING' });

    expect(getInitialStationStatuses([makeCartItem({ product: fixtureProducts.food })])).toEqual({
      baristaStatus: 'IDLE',
      kitchenStatus: 'PREPARING',
    });
  });

  it('keeps stations idle for held pending orders', () => {
    expect(
      getInitialStationStatuses(
        [makeCartItem({ product: fixtureProducts.coffee })],
        OrderStatus.PENDING,
      ),
    ).toEqual({ baristaStatus: 'IDLE', kitchenStatus: 'IDLE' });
  });
});

describe('KDS order state', () => {
  it('filters active orders for station and excludes held idle orders', () => {
    const activeBaristaOrder = makeOrder({
      id: 'active-barista',
      baristaStatus: 'PREPARING',
      kitchenStatus: 'IDLE',
      items: [makeCartItem({ product: fixtureProducts.coffee })],
    });
    const heldOrder = makeOrder({
      id: 'held',
      status: OrderStatus.PENDING,
      baristaStatus: 'IDLE',
      kitchenStatus: 'IDLE',
      items: [makeCartItem({ product: fixtureProducts.coffee })],
    });
    const kitchenOrder = makeOrder({
      id: 'active-kitchen',
      baristaStatus: 'IDLE',
      kitchenStatus: 'PREPARING',
      items: [makeCartItem({ product: fixtureProducts.food })],
    });

    expect(
      filterOrdersForStation([activeBaristaOrder, heldOrder, kitchenOrder], Role.BARISTA).map(
        order => order.id,
      ),
    ).toEqual(['active-barista']);
    expect(
      filterOrdersForStation([activeBaristaOrder, heldOrder, kitchenOrder], Role.KITCHEN).map(
        order => order.id,
      ),
    ).toEqual(['active-kitchen']);
  });

  it('resolves READY when all active stations are ready or completed', () => {
    expect(
      resolveGlobalOrderStatus(
        makeOrder({
          baristaStatus: 'READY',
          kitchenStatus: 'IDLE',
        }),
      ),
    ).toBe(OrderStatus.READY);

    expect(
      resolveGlobalOrderStatus(
        makeOrder({
          baristaStatus: 'READY',
          kitchenStatus: 'COMPLETED',
        }),
      ),
    ).toBe(OrderStatus.READY);
  });

  it('resolves COMPLETED when all active stations are completed', () => {
    expect(
      resolveGlobalOrderStatus(
        makeOrder({
          baristaStatus: 'COMPLETED',
          kitchenStatus: 'COMPLETED',
        }),
      ),
    ).toBe(OrderStatus.COMPLETED);
  });

  it('keeps PREPARING while an active station is still preparing', () => {
    expect(
      resolveGlobalOrderStatus(
        makeOrder({
          status: OrderStatus.PREPARING,
          baristaStatus: 'READY',
          kitchenStatus: 'PREPARING',
        }),
      ),
    ).toBe(OrderStatus.PREPARING);
  });
});

describe('KDS sorting', () => {
  it('sorts active orders by earliest station deadline', () => {
    const slowOrder = makeOrder({
      id: 'slow',
      createdAt: '2026-06-27T09:00:00.000Z',
      items: [
        makeCartItem({
          product: { ...fixtureProducts.coffee, standardPrepTime: 10 },
          quantity: 1,
        }),
      ],
    });
    const urgentOrder = makeOrder({
      id: 'urgent',
      createdAt: '2026-06-27T09:04:00.000Z',
      items: [
        makeCartItem({
          product: { ...fixtureProducts.coffee, standardPrepTime: 1 },
          quantity: 1,
        }),
      ],
    });

    expect(sortOrdersByDeadline([slowOrder, urgentOrder], Role.BARISTA).map(order => order.id)).toEqual([
      'urgent',
      'slow',
    ]);
  });
});
