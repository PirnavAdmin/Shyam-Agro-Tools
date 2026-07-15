using System;

namespace ShyamAgroSuite.Api.DTOs.Blog
{
    public class BlogResponseDto
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        public DateTime PublishDate { get; set; }

        public string? CoverImage { get; set; }

        public string? Summary { get; set; }

        public string Description { get; set; } = string.Empty;
    }
}
