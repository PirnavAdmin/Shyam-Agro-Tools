using Microsoft.AspNetCore.Http;

namespace ShyamAgroSuite.Api.Models
{
    public class UploadProfileImageRequest
    {
        public string MobileNumber { get; set; } = string.Empty;

        public IFormFile Image { get; set; } = null!;
    }
}
