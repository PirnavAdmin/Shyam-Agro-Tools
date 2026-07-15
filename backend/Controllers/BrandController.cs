using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/Catalog/brands")]
    public class BrandController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BrandController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task<string?> SaveUploadedFileAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0) return null;

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return $"/uploads/{uniqueFileName}";
        }

        private string? SaveBase64Image(string? base64String)
        {
            if (string.IsNullOrEmpty(base64String)) return null;

            if (!base64String.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                return base64String;
            }

            try
            {
                var commaIndex = base64String.IndexOf(',');
                if (commaIndex == -1) return base64String;

                var header = base64String.Substring(0, commaIndex);
                var data = base64String.Substring(commaIndex + 1);

                var ext = ".png";
                if (header.Contains("jpeg") || header.Contains("jpg")) ext = ".jpg";
                else if (header.Contains("gif")) ext = ".gif";
                else if (header.Contains("webp")) ext = ".webp";

                var imageBytes = Convert.FromBase64String(data);

                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + ext;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                System.IO.File.WriteAllBytes(filePath, imageBytes);

                return $"/uploads/{uniqueFileName}";
            }
            catch
            {
                return base64String;
            }
        }

        public class BrandUpsertDto
        {
            public string? Name { get; set; }
            public string? Description { get; set; }
            public string? LogoImage { get; set; }
            public IFormFile? LogoFile { get; set; }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Brand>>> GetBrands()
        {
            return await _context.Brands.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Brand>> GetBrand(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return NotFound();
            return brand;
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<Brand>> CreateBrand([FromForm] BrandUpsertDto request)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { Message = "Brand name is required." });
            }

            var uploadedUrl = await SaveUploadedFileAsync(request.LogoFile);
            var finalLogoImage = uploadedUrl ?? SaveBase64Image(request.LogoImage) ?? "";

            var brand = new Brand
            {
                Name = request.Name,
                Description = request.Description ?? "",
                LogoImage = finalLogoImage,
                IsActive = true
            };

            _context.Brands.Add(brand);

            var notification = new Notification
            {
                Title = "Brand Added",
                Message = $"New brand '{brand.Name}' registered.",
                Type = "BrandAdded"
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(brand);
        }

        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateBrand(int id, [FromForm] BrandUpsertDto request)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return NotFound(new { Message = "Brand not found." });

            if (!string.IsNullOrEmpty(request.Name))
            {
                brand.Name = request.Name;
            }

            if (request.Description != null)
            {
                brand.Description = request.Description;
            }

            var uploadedUrl = await SaveUploadedFileAsync(request.LogoFile);
            if (!string.IsNullOrEmpty(uploadedUrl))
            {
                brand.LogoImage = uploadedUrl;
            }
            else if (!string.IsNullOrEmpty(request.LogoImage))
            {
                brand.LogoImage = SaveBase64Image(request.LogoImage) ?? request.LogoImage;
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Brand updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBrand(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return NotFound(new { Message = "Brand not found." });

            // Product check removed
            var hasProducts = false;
            if (hasProducts) return BadRequest(new { Message = "Cannot delete brand because it is linked to active products. Please delete or reassign the products first." });

            _context.Brands.Remove(brand);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Brand deleted successfully" });
        }
    }
}

