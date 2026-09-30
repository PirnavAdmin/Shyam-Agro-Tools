using System;
using System.ComponentModel.DataAnnotations;

namespace ShyamAgroSuite.Api.Models
{
    public class Testimonial
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = string.Empty;

        [Required]
        public string Text { get; set; } = string.Empty;

        [Required]
        public string ImageUrl { get; set; } = string.Empty;

        public int Rating { get; set; } = 5;

        public bool IsActive { get; set; } = true;

        public int SortOrder { get; set; } = 0;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }

        public string? Location { get; set; }

        public string? CompanyName { get; set; }

        public string? ProductName { get; set; }
    }
}
