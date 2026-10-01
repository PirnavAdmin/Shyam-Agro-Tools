using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShyamAgroSuite.Api.DTOs.Cashfree;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.Services.Interfaces;

namespace ShyamAgroSuite.Api.Services
{
    public class CashfreePaymentService : ICashfreePaymentService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly CashfreeSettings _settings;
        private readonly ILogger<CashfreePaymentService> _logger;

        public CashfreePaymentService(
            IHttpClientFactory httpClientFactory,
            IOptions<CashfreeSettings> settingsOptions,
            ILogger<CashfreePaymentService> logger)
        {
            _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
            _settings = settingsOptions?.Value ?? throw new ArgumentNullException(nameof(settingsOptions));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<CreatePaymentOrderResponseDto> CreateOrderAsync(
            CreatePaymentOrderRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            // Generate unique Order ID if not provided
            var orderId = !string.IsNullOrWhiteSpace(request.OrderId)
                ? request.OrderId
                : $"ORD_{DateTime.UtcNow:yyyyMMddHHmmss}_{Random.Shared.Next(1000, 9999)}";

            // Map application request DTO to Cashfree order creation request DTO
            var cashfreeRequest = new CashfreeCreateOrderRequest
            {
                OrderId = orderId,
                OrderAmount = request.OrderAmount,
                OrderCurrency = string.IsNullOrWhiteSpace(request.OrderCurrency) ? "INR" : request.OrderCurrency,
                CustomerDetails = new CashfreeCustomerDetails
                {
                    CustomerId = request.CustomerId,
                    CustomerName = request.CustomerName,
                    CustomerEmail = request.CustomerEmail,
                    CustomerPhone = request.CustomerPhone
                },
                OrderNote = request.OrderNote
            };

            // Use the named HttpClient configured for Cashfree Sandbox
            var client = _httpClientFactory.CreateClient("Cashfree");

            _logger.LogInformation("Sending Cashfree order creation request for OrderId: {OrderId}, Amount: {Amount}", orderId, request.OrderAmount);

            HttpResponseMessage httpResponse;
            try
            {
                httpResponse = await client.PostAsJsonAsync("orders", cashfreeRequest, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HTTP request failure while attempting to create Cashfree order for OrderId: {OrderId}", orderId);
                throw new InvalidOperationException($"Failed to communicate with Cashfree API: {ex.Message}", ex);
            }

            var responseBody = await httpResponse.Content.ReadAsStringAsync(cancellationToken);

            _logger.LogInformation("Cashfree order creation response status: {StatusCode}", httpResponse.StatusCode);
            _logger.LogInformation("Cashfree order creation response body: {ResponseBody}", responseBody);

            if (!httpResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Cashfree order creation failed with status code {StatusCode}. Response: {ResponseBody}", httpResponse.StatusCode, responseBody);
                throw new InvalidOperationException($"Cashfree API order creation failed with status {(int)httpResponse.StatusCode} ({httpResponse.ReasonPhrase}): {responseBody}");
            }

            CashfreeCreateOrderResponse? cashfreeResponse;
            try
            {
                cashfreeResponse = JsonSerializer.Deserialize<CashfreeCreateOrderResponse>(responseBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deserialize Cashfree response. Body: {ResponseBody}", responseBody);
                throw new InvalidOperationException("Failed to process Cashfree response payload.", ex);
            }

            if (cashfreeResponse == null)
            {
                throw new InvalidOperationException("Cashfree API returned an empty or invalid response.");
            }

            _logger.LogInformation("Cashfree order created successfully. CfOrderId: {CfOrderId}, PaymentSessionId Length: {SessionIdLength}", cashfreeResponse.CfOrderId, cashfreeResponse.PaymentSessionId?.Length ?? 0);

            // Return application response DTO
            return new CreatePaymentOrderResponseDto
            {
                CashfreeOrderId = cashfreeResponse.CfOrderId,
                OrderId = cashfreeResponse.OrderId,
                PaymentSessionId = cashfreeResponse.PaymentSessionId,
                OrderStatus = cashfreeResponse.OrderStatus,
                OrderAmount = cashfreeResponse.OrderAmount,
                OrderCurrency = string.IsNullOrWhiteSpace(cashfreeResponse.OrderCurrency) ? "INR" : cashfreeResponse.OrderCurrency,
                Environment = _settings.Environment
            };
        }
    }
}
