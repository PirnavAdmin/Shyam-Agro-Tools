import { getOrderTracking, orderStatusSteps } from './USER/utils/orders';

test('order tracking includes the complete customer timeline', () => {
  const tracking = getOrderTracking({ status: 'Shipped', createdAt: '2026-06-08T10:00:00.000Z' });

  expect(tracking.steps.map((step) => step.label)).toEqual(orderStatusSteps);
  expect(tracking.steps.find((step) => step.label === 'Confirmed')).toBeTruthy();
  expect(tracking.status).toBe('Shipped');
});
