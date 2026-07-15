import axios from '../api/axios';
import { getManualPaymentVerifications, submitManualPaymentVerification } from './paymentService';

jest.mock('../api/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('submitManualPaymentVerification', () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it('submits the exact Swagger multipart fields', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        status: 'Pending Verification',
      },
    });
    const screenshot = new File(['image'], 'payment.png', { type: 'image/png' });

    await submitManualPaymentVerification({
      orderId: 'ORDER-1',
      utrNumber: 'UTR12345678',
      amountPaid: 1500,
      paymentDate: '2026-07-09',
      paymentTime: '10:30',
      customerName: 'Test Customer',
      mobileNumber: '9876543210',
      remarks: 'Paid',
      screenshot,
    });

    const [url, body, config] = axios.post.mock.calls[0];
    expect(url).toMatch(/\/api\/Payment\/verify-manual$/);
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('OrderId')).toBe('ORDER-1');
    expect(body.get('UtrNumber')).toBe('UTR12345678');
    expect(body.get('AmountPaid')).toBe('1500');
    expect(body.get('PaymentDate')).toBe('2026-07-09');
    expect(body.get('PaymentTime')).toBe('10:30');
    expect(body.get('CustomerName')).toBe('Test Customer');
    expect(body.get('MobileNumber')).toBe('9876543210');
    expect(body.get('Remarks')).toBe('Paid');
    expect(body.get('Screenshot').name).toBe('payment.png');
    expect(body.get('Screenshot').type).toBe('image/png');
    expect(config.headers['Content-Type']).toBeUndefined();
  });

  it('reads manual verification history from the backend value field', async () => {
    axios.get.mockResolvedValue({
      data: {
        value: [
          {
            id: 9,
            orderId: 'SAT202607101734',
            utrNumber: 'T2607101611381565444106',
            verificationStatus: 'Approved',
          },
        ],
        Count: 1,
      },
    });

    const result = await getManualPaymentVerifications();

    expect(axios.get.mock.calls[0][0]).toMatch(/\/api\/Payment\/manual-verifications$/);
    expect(result).toHaveLength(1);
    expect(result[0].orderId).toBe('SAT202607101734');
  });
});
