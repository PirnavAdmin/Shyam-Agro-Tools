using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    // Maps to the existing "UserLogin1" table in the remote database
    [Table("TestUsers")]
    public class TestUser
    {
        public int Id { get; set; }

        public string MobileNumber { get; set; } = string.Empty;

        public string? FullName { get; set; }

        public string? Email { get; set; }

        public string? ProfileImageUrl { get; set; }

        public string? DoorNo { get; set; }

        public string? StreetArea { get; set; }

        public string? City { get; set; }

        public string? State { get; set; }

        public string? Pincode { get; set; }

        public string? OTP { get; set; }

        public DateTime? OTPGeneratedAt { get; set; }

        public bool IsVerified { get; set; } = false;


        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }
    }
}
