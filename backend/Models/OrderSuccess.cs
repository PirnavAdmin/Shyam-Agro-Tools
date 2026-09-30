using System.ComponentModel.DataAnnotations;

namespace ShyamAgroSuite.Api.Models
{
    public class OrderSuccess
    {
        [Key]
        public string OrderId { get; set; }

        public int CustomerAddressId { get; set; }

        public decimal TotalAmount { get; set; }

        public string PaymentMethod { get; set; }

        public string OrderStatus { get; set; }

        public DateTime OrderDate { get; set; }

        public bool IsTrackEnabled { get; set; }

        // --- Payment Details Columns ---
        public string? UpiId { get; set; }
        public string? CardNumber { get; set; } // Masked card number
        public string? NameOnCard { get; set; }
        public string? ExpiryDate { get; set; }
        public string? BankName { get; set; }
        public string? TransactionId { get; set; }
        public string? PaymentStatus { get; set; } // "Pending", "Success", "Failed"
    }
}