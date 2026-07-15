using System.Collections.Generic;

namespace ShyamAgroSuite.Api.Models
{
    public class Product
    {
        public int Id { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        public string SKU { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;

        public int SubcategoryId { get; set; }
        public Subcategory? Subcategory { get; set; }

        public string? ShortDescription { get; set; }
        public string? ProductDetails { get; set; }
        public string? PackageIncludes { get; set; }

        public string? Weight { get; set; }
        public string? Dimensions { get; set; }
        public string? PowerSource { get; set; }
        public string? Material { get; set; }
        public string? CoverageUsage { get; set; }

        public decimal AverageRating { get; set; }
        public int TotalReviews { get; set; }

        // Star rating breakdown (set manually or auto-recalculated from reviews)
        public int FiveStar { get; set; }
        public int FourStar { get; set; }
        public int ThreeStar { get; set; }
        public int TwoStar { get; set; }
        public int OneStar { get; set; }

        public decimal MRP { get; set; }
        public int Stock { get; set; }

        public string? DiscountType { get; set; }
        public decimal DiscountAmount { get; set; }

        public decimal? SellingPrice { get; set; }

        public string StockStatus { get; set; } = string.Empty;

        // Stock Ledger fields
        public int ReorderLevel { get; set; } = 30;
        public decimal CostPrice { get; set; }
        public string? SupplierName { get; set; } = "AquaFlow Pvt Ltd";
        public string? Trend30Day { get; set; } = "+10%";
        public System.DateTime LastUpdated { get; set; } = System.DateTime.UtcNow;

        public string? CountryOfOrigin { get; set; }
        public bool CODAvailability { get; set; }

        public string? EstimatedDelivery { get; set; }
        public string? DeliveryReturn { get; set; }

        public bool IsActive { get; set; } = true;

        public List<ProductImage> Images { get; set; } = new();
        public List<ProductVideo> Videos { get; set; } = new();
        public List<ProductFeature> Features { get; set; } = new();
        public List<ProductReview> Reviews { get; set; } = new();
    }
}
