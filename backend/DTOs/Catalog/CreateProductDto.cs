using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace ShyamAgroSuite.Api.DTOs.Catalog
{
    public class CreateProductDto
    {
        public string ProductName { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;

        public decimal MRP { get; set; }
        public int Stock { get; set; }
        public int CategoryId { get; set; }
        public int SubcategoryId { get; set; }

        public List<IFormFile> Images { get; set; } = new();
        public IFormFile? Video { get; set; }

        public string ShortDescription { get; set; } = string.Empty;
        public string ProductDetails { get; set; } = string.Empty;
        public string PackageIncludes { get; set; } = string.Empty;
        public string Weight { get; set; } = string.Empty;
        public string Dimensions { get; set; } = string.Empty;
        public string PowerSource { get; set; } = string.Empty;
        public string Material { get; set; } = string.Empty;
        public string CoverageUsage { get; set; } = string.Empty;
        public string CountryOfOrigin { get; set; } = string.Empty;
        public string EstimatedDelivery { get; set; } = string.Empty;
        public string DeliveryReturn { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public decimal SellingPrice { get; set; }
        public string? StockStatus { get; set; }
        public bool CODAvailability { get; set; }
        public bool IsActive { get; set; } = true;

        // Reviews & Ratings
        public decimal AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public int FiveStar { get; set; }
        public int FourStar { get; set; }
        public int ThreeStar { get; set; }
        public int TwoStar { get; set; }
        public int OneStar { get; set; }

        // Features & Reviews Binding
        public List<string>? Features { get; set; }
        public string? FeaturesJson { get; set; }
        public string? ReviewsJson { get; set; }
    }
}
