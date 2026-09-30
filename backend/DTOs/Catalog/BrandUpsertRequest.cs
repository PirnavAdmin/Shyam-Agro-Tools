using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ShyamAgroSuite.Api.DTOs.Catalog
{
    public class BrandUpsertRequest
    {
        [FromForm(Name = "name")]
        public string? Name { get; set; }

        [FromForm(Name = "brandName")]
        public string? BrandName { get; set; }

        [FromForm(Name = "description")]
        public string? Description { get; set; }

        [FromForm(Name = "logoImage")]
        public string? LogoImage { get; set; }

        [FromForm(Name = "logoFile")]
        public IFormFile? LogoFile { get; set; }
    }
}
