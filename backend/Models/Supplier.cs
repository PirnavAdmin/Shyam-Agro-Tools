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
        public int ProductCount { get; set; } = 0;
        public double PerformanceRating { get; set; } = 5.0; // scale 1.0 - 5.0
        public string CommercialTerms { get; set; } = "Net 30"; // e.g. "Net 30", "COD", "Net 45"
        public bool IsActive { get; set; } = true;

        // Seller Registration fields
        public string? Gstin { get; set; }
        public string? ProductCategory { get; set; }
        public string? TrackingId { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    }
}
