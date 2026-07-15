using System;
using System.Collections.Generic;

namespace ShyamAgroSuite.Api.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public GrowerUser? User { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Status { get; set; } = "Active"; // Active, Inactive
        public DateTime JoinDate { get; set; } = DateTime.UtcNow;
        public int CoinsBalance { get; set; } = 0;

        public string Address { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ProfilePicture { get; set; } = string.Empty;

        // Navigation properties
        public CustomerAgrarian? AgrarianProfile { get; set; }
        public List<CustomerAdvisory> Advisories { get; set; } = new();
        public List<Order> Orders { get; set; } = new();
    }
}
