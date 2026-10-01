using System;

namespace ShyamAgroSuite.Api.Models
{
    public class Staff
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = "Advisory"; // e.g. Advisory, Sales, Inventory, Admin
        public string Status { get; set; } = "Active"; // Active, Inactive
        public DateTime DateJoined { get; set; } = DateTime.UtcNow;
    }
}
