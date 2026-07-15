using System;
using System.ComponentModel.DataAnnotations;

namespace ShyamAgroSuite.Api.Models
{
    public class Blog
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        public DateTime PublishDate { get; set; }

        public string? CoverImage { get; set; }

        public string? Summary { get; set; }

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}
