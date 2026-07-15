using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("BankDetailsConfigs")]
    public class BankDetailsConfig
    {
        [Key]
        public int Id { get; set; }
        public string IfscCode { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string Branch { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountHolderName { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("UpiDetailsConfigs")]
    public class UpiDetailsConfig
    {
        [Key]
        public int Id { get; set; }
        public string MerchantUpiId { get; set; } = string.Empty;
        public string MerchantName { get; set; } = string.Empty;
        public string BankDisplayName { get; set; } = string.Empty;
        public string Currency { get; set; } = "INR";
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("QrCodeConfigs")]
    public class QrCodeConfig
    {
        [Key]
        public int Id { get; set; }
        public string QrImageUrl { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
