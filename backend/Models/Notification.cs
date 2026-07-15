using System;

namespace ShyamAgroSuite.Api.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // e.g. "LowStock", "NewSupplier", "NewOrder", "NewProduct", "CouponCreated", "CouponExpired", "CouponLimitReached", "BrandAdded", "BlogCreated", "StaffAdded"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
    }
}
