using System;

namespace ShyamAgroSuite.Api.Models
{
    public class Banner
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string TargetUrl { get; set; } = "/categories";
        public string BannerType { get; set; } = "Hero"; // "Hero", "Promo", "Category"
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
