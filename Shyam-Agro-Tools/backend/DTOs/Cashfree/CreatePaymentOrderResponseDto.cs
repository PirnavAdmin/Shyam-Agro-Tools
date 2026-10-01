using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.DTOs.Cashfree
{
    /// <summary>
    /// Response DTO returned by our application backend to the frontend client after initiating a Cashfree payment order.
    /// </summary>
    public class CreatePaymentOrderResponseDto
    {
        [JsonPropertyName("cashfreeOrderId")]
        public string CashfreeOrderId { get; set; } = string.Empty;

        [JsonPropertyName("orderId")]
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("paymentSessionId")]
        public string PaymentSessionId { get; set; } = string.Empty;

        [JsonPropertyName("orderStatus")]
        public string OrderStatus { get; set; } = string.Empty;

        [JsonPropertyName("orderAmount")]
        public decimal OrderAmount { get; set; }

        [JsonPropertyName("orderCurrency")]
        public string OrderCurrency { get; set; } = "INR";

        [JsonPropertyName("environment")]
        public string? Environment { get; set; }
    }
}
