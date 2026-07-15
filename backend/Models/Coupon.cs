using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    public class Coupon
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "Percentage"; // Percentage, FixedAmount
        public decimal DiscountValue { get; set; }
        public decimal MinCartValue { get; set; }
        public int UsageLimit { get; set; } = 100;
        public int UsedCount { get; set; } = 0;
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime EndDate { get; set; } = DateTime.UtcNow.AddMonths(1);
        public bool IsActive { get; set; } = true;

        // Expanded fields for Mobile UI & image assets support
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? TermsAndConditions { get; set; }
        public string? BackgroundImageUrl { get; set; }
        public string? BannerImageUrl { get; set; }
        public string? ThumbnailImageUrl { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedDate { get; set; }

        [NotMapped]
        public string CouponStatus
        {
            get
            {
                if (!IsActive) return "Inactive";
                if (DateTime.UtcNow < StartDate) return "Upcoming";
                if (DateTime.UtcNow > EndDate) return "Expired";
                if (UsedCount >= UsageLimit) return "LimitReached";
                return "Active";
            }
        }
    }
}
