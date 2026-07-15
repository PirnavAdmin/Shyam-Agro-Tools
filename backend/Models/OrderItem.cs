using System;
using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.Models
{
    public class OrderItem
    {
        public int Id { get; set; }
        public int OrderId { get; set; }

        [JsonIgnore]
        public Order? Order { get; set; }

        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;
        public string ProductCode { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public decimal Subtotal { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string ImageUrl { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public bool ReturnEligible { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public bool ReplacementEligible { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public DateTime? ReturnWindowEndsAt { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public int? ReturnRequestId { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string? ReturnRequestNumber { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string? ReturnRequestType { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string? ReturnRequestStatus { get; set; }
    }
}
