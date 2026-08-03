using System;

namespace ShyamAgroSuite.Api.Models
{
    public class ProductReview
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public DateTime ReviewDate { get; set; }
        public string ReviewComment { get; set; } = string.Empty;
        public bool VerifiedPurchase { get; set; }
    }
}
