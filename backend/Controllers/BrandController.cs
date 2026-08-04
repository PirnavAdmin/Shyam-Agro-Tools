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

        private static readonly string[] AllowedExtensions = { ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif" };

        private async Task<string?> SaveUploadedFileAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0) return null;

            if (file.Length > 2 * 1024 * 1024)
            {
                throw new ArgumentException("Uploaded logo file size exceeds 2MB limit. Please select a smaller file.");
            }

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext) || !(file.ContentType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ?? false))
            {
                throw new ArgumentException("Invalid file format. Only image files (PNG, JPG, JPEG, WEBP, SVG) are allowed.");
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + ext;
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

                var imageBytes = Convert.FromBase64String(data);
                if (imageBytes.Length > 2 * 1024 * 1024)
                {
                    throw new ArgumentException("Logo image size exceeds 2MB limit.");
                }

                var ext = ".png";
                if (header.Contains("jpeg") || header.Contains("jpg")) ext = ".jpg";
                else if (header.Contains("gif")) ext = ".gif";
                else if (header.Contains("webp")) ext = ".webp";
                else if (header.Contains("svg")) ext = ".svg";

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

        private (bool IsValid, string ErrorMessage) ValidateBrandName(string? rawName)
        {
            if (string.IsNullOrWhiteSpace(rawName))
            {
                return (false, "Brand name is required.");
            }

            var trimmed = rawName.Trim();

            if (trimmed.Length < 2 || trimmed.Length > 50)
            {
                return (false, "Brand name must be between 2 and 50 characters.");
            }

            if (!trimmed.Any(char.IsLetter))
            {
                return (false, "Brand name must contain valid letters.");
            }

            if (System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"(.)\1{3,}"))
            {
                return (false, "Brand name cannot contain repeated random characters.");
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^[A-Za-z0-9][A-Za-z0-9\s&\-\'\./]{1,49}$"))
            {
                return (false, "Brand name contains invalid characters. Only letters, numbers, spaces, and standard punctuation (&, -, ', ., /) are allowed.");
            }

            return (true, string.Empty);
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<Brand>> CreateBrand([FromForm] BrandUpsertDto request)
        {
            var validation = ValidateBrandName(request.Name);
            if (!validation.IsValid)
            {
                return BadRequest(new { Message = validation.ErrorMessage });
            }

            var trimmedName = request.Name!.Trim();

            var exists = await _context.Brands.AnyAsync(b => b.Name.ToLower() == trimmedName.ToLower());
            if (exists)
            {
                return BadRequest(new { Message = $"A brand with the name '{trimmedName}' already exists." });
            }

            string? finalLogoImage = "";
            try
            {
                var uploadedUrl = await SaveUploadedFileAsync(request.LogoFile);
                finalLogoImage = uploadedUrl ?? SaveBase64Image(request.LogoImage) ?? "";
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }

            var brand = new Brand
            {
                Name = trimmedName,
                Description = request.Description?.Trim() ?? "",
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
                var validation = ValidateBrandName(request.Name);
                if (!validation.IsValid)
                {
                    return BadRequest(new { Message = validation.ErrorMessage });
                }

                var trimmedName = request.Name.Trim();

                var exists = await _context.Brands.AnyAsync(b => b.Id != id && b.Name.ToLower() == trimmedName.ToLower());
                if (exists)
                {
                    return BadRequest(new { Message = $"Another brand with the name '{trimmedName}' already exists." });
                }

                brand.Name = trimmedName;
            }

            if (request.Description != null)
            {
                brand.Description = request.Description.Trim();
            }

            try
            {
                var uploadedUrl = await SaveUploadedFileAsync(request.LogoFile);
                if (!string.IsNullOrEmpty(uploadedUrl))
                {
                    brand.LogoImage = uploadedUrl;
                }
                else if (!string.IsNullOrEmpty(request.LogoImage))
                {
                    brand.LogoImage = SaveBase64Image(request.LogoImage) ?? request.LogoImage;
                }
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
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

