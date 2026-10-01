using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("password_reset")]
    public class PasswordReset
    {
        [Key]
        public long ResetId { get; set; }

        public string Email { get; set; }

        public string ResetOtp { get; set; }

        public DateTime ExpiryTime { get; set; }

        public bool IsUsed { get; set; }

        public DateTime CreatedDate { get; set; }
    }
}