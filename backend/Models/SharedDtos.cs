using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace ShyamAgroSuite.Api.Models
{
    // Advisory DTOs
    public class AdvisoryLogRequest
    {
        public int CustomerId { get; set; }
        public string AdvisoryText { get; set; } = string.Empty;
        public string Recommendation { get; set; } = string.Empty;
        public int StaffId { get; set; }
    }

    // Order Update DTOs
    public class OrderStatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty; // Pending, Shipped, Delivered, Cancelled
        public string TrackingNumber { get; set; } = string.Empty;
        public string CarrierName { get; set; } = string.Empty;
    }
}
