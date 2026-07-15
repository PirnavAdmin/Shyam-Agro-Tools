using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ShyamAgroSuite.Api.DTOs.Blog
{
    public class CreateBlogDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string AuthorName { get; set; } = string.Empty;

        public DateTime PublishDate { get; set; }

        public IFormFile? CoverImage { get; set; }

        public string? Summary { get; set; }

        public string Description { get; set; } = string.Empty;
    }
}
