using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("otp_verification")]
    public class OtpVerification
    {
        [Key]
        public long OtpId { get; set; }

        public string Email { get; set; }

        public string OtpCode { get; set; }

        public DateTime ExpiryTime { get; set; }

        public bool IsUsed { get; set; }

        public DateTime CreatedDate { get; set; }
    }
}