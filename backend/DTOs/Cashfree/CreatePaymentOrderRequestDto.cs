using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.DTOs.Cashfree
{
    /// <summary>
    /// Incoming request DTO from application client/frontend to initiate a Cashfree payment order.
    /// </summary>
    public class CreatePaymentOrderRequestDto
    {
        private decimal _amount;
        private string _currency = "INR";

        [JsonPropertyName("amount")]
        public decimal Amount
        {
            get => _amount > 0 ? _amount : _amount;
            set => _amount = value;
        }

        [JsonPropertyName("orderAmount")]
        public decimal OrderAmount
        {
            get => _amount;
            set => _amount = value;
        }

        [JsonPropertyName("currency")]
        public string Currency
        {
            get => !string.IsNullOrWhiteSpace(_currency) ? _currency : "INR";
            set => _currency = value;
        }

        [JsonPropertyName("orderCurrency")]
        public string OrderCurrency
        {
            get => !string.IsNullOrWhiteSpace(_currency) ? _currency : "INR";
            set => _currency = value;
        }

        [JsonPropertyName("customerId")]
        public string CustomerId { get; set; } = string.Empty;

        [JsonPropertyName("customerName")]
        public string CustomerName { get; set; } = string.Empty;

        [JsonPropertyName("customerEmail")]
        public string CustomerEmail { get; set; } = string.Empty;

        [JsonPropertyName("customerPhone")]
        public string CustomerPhone { get; set; } = string.Empty;

        [JsonPropertyName("orderId")]
        public string? OrderId { get; set; }

        [JsonPropertyName("orderNote")]
        public string? OrderNote { get; set; }
    }
}
