using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("WalletTransactions")]
    public class WalletTransaction
    {
        [Key]
        public int Id { get; set; }

        public int CustomerId { get; set; }

        [Required]
        public string Type { get; set; } = string.Empty; // Credit, Debit

        [Required]
        public string Source { get; set; } = string.Empty; // WelcomeBonus, Earned, Redeemed, Expired

        [Required]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int Coins { get; set; }

        public string? OrderId { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? ExpiresAt { get; set; }
    }
}
