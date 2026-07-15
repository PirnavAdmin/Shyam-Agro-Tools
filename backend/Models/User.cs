using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("admin_user")]
    public class User
    {
        [Key]
        public string Email { get; set; }

        public string Password { get; set; }

        public string Role { get; set; }

        public string? Otp { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedDate { get; set; }

        public string? FullName { get; set; }

        public string? MobileNumber { get; set; }

        public string? EmployeeId { get; set; }
    }
}