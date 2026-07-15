using System;
using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.Models
{
    public class StockLedgerLog
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        
        [JsonIgnore]
        public Product? Product { get; set; }

        public string ActionType { get; set; } = string.Empty; // ADD, REMOVE
        public int Quantity { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
