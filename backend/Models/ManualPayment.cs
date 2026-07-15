using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("ManualPayments")]
    public class ManualPayment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        public string UtrNumber { get; set; } = string.Empty;

        public decimal AmountPaid { get; set; }

        [Required]
        public string PaymentDate { get; set; } = string.Empty;

        [Required]
        public string PaymentTime { get; set; } = string.Empty;

        [Required]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        public string MobileNumber { get; set; } = string.Empty;

        public string? Remarks { get; set; }

        public string? ScreenshotUrl { get; set; }

        public string VerificationStatus { get; set; } = "Pending"; // Pending, Approved, Rejected

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}
