using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.DTOs.Cashfree
{
    /// <summary>
    /// Response payload received and deserialized from Cashfree's PG API v3 endpoint.
    /// </summary>
    public class CashfreeCreateOrderResponse
    {
        [JsonPropertyName("cf_order_id")]
        public string CfOrderId { get; set; } = string.Empty;

        [JsonPropertyName("order_id")]
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("payment_session_id")]
        public string PaymentSessionId { get; set; } = string.Empty;

        [JsonPropertyName("order_status")]
        public string OrderStatus { get; set; } = string.Empty;

        [JsonPropertyName("order_amount")]
        public decimal OrderAmount { get; set; }

        [JsonPropertyName("order_currency")]
        public string OrderCurrency { get; set; } = string.Empty;

        [JsonPropertyName("customer_details")]
        public CashfreeCustomerDetails? CustomerDetails { get; set; }

        [JsonPropertyName("entity")]
        public string? Entity { get; set; }
    }
}
