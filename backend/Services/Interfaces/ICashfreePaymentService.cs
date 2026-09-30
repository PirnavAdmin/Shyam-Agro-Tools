using System.Threading;
using System.Threading.Tasks;
using ShyamAgroSuite.Api.DTOs.Cashfree;

namespace ShyamAgroSuite.Api.Services.Interfaces
{
    public interface ICashfreePaymentService
    {
        /// <summary>
        /// Initiates a payment order with Cashfree PG API v3 and returns session details for checkout.
        /// </summary>
        /// <param name="request">Incoming application payment order request DTO</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Application response DTO containing Cashfree order ID, session ID, and status</returns>
        Task<CreatePaymentOrderResponseDto> CreateOrderAsync(CreatePaymentOrderRequestDto request, CancellationToken cancellationToken = default);
    }
}
