using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.Models
{
    public class Order
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }

        [JsonIgnore]
        public Customer? Customer { get; set; }

        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        // Pricing summary
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal GstAmount { get; set; }
        public decimal FinalAmount { get; set; }

        // Logistics / Status
        public string Status { get; set; } = "Pending"; // Pending, Shipped, Delivered, Cancelled
        public string PaymentStatus { get; set; } = "Pending"; // Pending, Paid, Failed
        public string PaymentMethod { get; set; } = "COD"; // COD, Online
        public string ShippingAddress { get; set; } = string.Empty;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
        public string TrackingNumber { get; set; } = string.Empty;
        public string CarrierName { get; set; } = string.Empty;

        // Packing/Shipping Details
        public string? PackerName { get; set; }
        public string? PackerPhotoUrl { get; set; }
        public string? PackagePhotoUrl { get; set; }

        // Items
        public List<OrderItem> Items { get; set; } = new();
    }
}
