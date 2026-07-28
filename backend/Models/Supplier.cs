using System;

namespace ShyamAgroSuite.Api.Models
{
    public class Supplier
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public int ProductCount { get; set; } = 0;
        public double PerformanceRating { get; set; } = 4.5;
        public string CommercialTerms { get; set; } = "Net 30";
        public bool IsActive { get; set; } = true;
        public string LeadTime { get; set; } = "4-6 days";
        public string ProductLines { get; set; } = string.Empty;
        public int ActivePo { get; set; } = 0;
        public double MonthlySpend { get; set; } = 0;
        public DateTime? LastSupply { get; set; }

        // Seller Registration fields
        public string? Gstin { get; set; }
        public string? ProductCategory { get; set; }
        public string? TrackingId { get; set; }
        public string Status { get; set; } = "Pending";
    }
}
