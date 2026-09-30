using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("Users")]
    public class GrowerUser
    {
        public int Id { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = "Grower"; // e.g., "Grower", "Advisor"
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
    }
}
