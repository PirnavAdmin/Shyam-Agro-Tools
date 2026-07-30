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

        /// <summary>
        /// True only when the UTR has been matched against a real bank SMS via ReconcileSms.
        /// UpdateManualStatus will not allow "Approved" unless this is true.
        /// </summary>
        public bool SmsVerified { get; set; } = false;

        /// <summary>
        /// The UTR extracted from the bank SMS that was matched to this payment.
        /// </summary>
        public string? VerifiedUtr { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}
