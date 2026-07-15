using Microsoft.AspNetCore.Http;

namespace ShyamAgroSuite.Api.DTOs.Catalog
{
    public class CategoryUpsertRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public IFormFile? ImageFile { get; set; }
    }
}
