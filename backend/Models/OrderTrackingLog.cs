using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("OrderTrackingLogs")]
    public class OrderTrackingLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public string Status { get; set; } = string.Empty; // e.g. Order Placed, Payment Verified, Processing, Packed, Shipped, Dispatched, Completed, Cancelled

        [Required]
        public string Description { get; set; } = string.Empty; // Description display notes

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
