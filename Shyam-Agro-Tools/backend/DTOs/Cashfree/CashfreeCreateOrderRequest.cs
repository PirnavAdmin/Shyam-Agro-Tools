using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.DTOs.Cashfree
{
    /// <summary>
    /// Outgoing request payload sent directly to Cashfree's PG API v3 endpoints.
    /// </summary>
    public class CashfreeCreateOrderRequest
    {
        [JsonPropertyName("order_id")]
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("order_amount")]
        public decimal OrderAmount { get; set; }

        [JsonPropertyName("order_currency")]
        public string OrderCurrency { get; set; } = "INR";

        [JsonPropertyName("customer_details")]
        public CashfreeCustomerDetails CustomerDetails { get; set; } = new();

        [JsonPropertyName("order_meta")]
        public CashfreeOrderMeta? OrderMeta { get; set; }

        [JsonPropertyName("order_note")]
        public string? OrderNote { get; set; }
    }

    public class CashfreeCustomerDetails
    {
        [JsonPropertyName("customer_id")]
        public string CustomerId { get; set; } = string.Empty;

        [JsonPropertyName("customer_name")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("customer_email")]
        public string CustomerEmail { get; set; } = string.Empty;

        [JsonPropertyName("customer_phone")]
        public string CustomerPhone { get; set; } = string.Empty;
    }

    public class CashfreeOrderMeta
    {
        [JsonPropertyName("return_url")]
        public string? ReturnUrl { get; set; }

        [JsonPropertyName("notify_url")]
        public string? NotifyUrl { get; set; }

        [JsonPropertyName("payment_methods")]
        public string? PaymentMethods { get; set; }
    }
}
