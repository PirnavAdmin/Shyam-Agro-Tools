using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("otps")]
    public class OtpRecord
    {
        [Key]
        public long Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Recipient { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Purpose { get; set; } = "Login";

        [Required]
        [MaxLength(256)]
        public string CodeHash { get; set; } = string.Empty;

        public DateTime Expiry { get; set; }

        public bool IsUsed { get; set; } = false;

        [MaxLength(100)]
        public string ChallengeId { get; set; } = string.Empty;

        public int? UserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
