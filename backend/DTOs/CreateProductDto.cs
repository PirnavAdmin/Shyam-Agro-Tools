using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace ShyamAgroSuite.Api.DTOs
{
    public class CreateProductDto
    {
        public string ProductName { get; set; }
        public string SKU { get; set; }
        public string Brand { get; set; }
        public string Manufacturer { get; set; }
        public decimal MRP { get; set; }
        public int Stock { get; set; }
        public int CategoryId { get; set; }
        public int SubcategoryId { get; set; }
        public List<IFormFile> Images { get; set; }
        public IFormFile? Video { get; set; }
        public string ShortDescription { get; set; }
        public string ProductDetails { get; set; }
        public string PackageIncludes { get; set; }
        public string Weight { get; set; }
        public string Dimensions { get; set; }
        public string PowerSource { get; set; }
        public string Material { get; set; }
        public string CoverageUsage { get; set; }
        public string CountryOfOrigin { get; set; }
        public string EstimatedDelivery { get; set; }
        public string DeliveryReturn { get; set; }
        public string DiscountType { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal SellingPrice { get; set; }
        public string? StockStatus { get; set; }
        public bool CODAvailability { get; set; }
    }
}
