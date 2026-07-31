using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BannersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BannersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET api/Banners?type=Hero
        [HttpGet]
        public async Task<IActionResult> GetActiveBanners([FromQuery] string? type)
        {
            try
            {
                var query = _context.Banners.AsQueryable().Where(b => b.IsActive);

                if (!string.IsNullOrWhiteSpace(type))
                {
                    query = query.Where(b => b.BannerType.ToLower() == type.Trim().ToLower());
                }

                var banners = await query
                    .OrderBy(b => b.DisplayOrder)
                    .ThenByDescending(b => b.CreatedAt)
                    .ToListAsync();

                return Ok(banners);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching active banners", error = ex.Message });
            }
        }

        // GET api/Banners/admin
        [HttpGet("admin")]
        public async Task<IActionResult> GetAllBannersForAdmin()
        {
            try
            {
                var banners = await _context.Banners
                    .OrderBy(b => b.DisplayOrder)
                    .ThenByDescending(b => b.CreatedAt)
                    .ToListAsync();

                return Ok(banners);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching admin banners", error = ex.Message });
            }
        }

        // GET api/Banners/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return NotFound(new { message = "Banner not found" });
            return Ok(banner);
        }

        // POST api/Banners
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Banner banner)
        {
            if (banner == null) return BadRequest(new { message = "Invalid banner payload" });

            try
            {
                if (string.IsNullOrWhiteSpace(banner.BannerType)) banner.BannerType = "Hero";
                if (string.IsNullOrWhiteSpace(banner.TargetUrl)) banner.TargetUrl = "/categories";
                banner.CreatedAt = DateTime.UtcNow;

                _context.Banners.Add(banner);
                await _context.SaveChangesAsync();

                // Add notification
                var notification = new Notification
                {
                    Title = "New Banner Created",
                    Message = $"Banner '{banner.Title}' ({banner.BannerType}) has been created.",
                    Type = "BannerCreated"
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = banner.Id }, banner);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating banner", error = ex.Message });
            }
        }

        // PUT api/Banners/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Banner updated)
        {
            if (updated == null) return BadRequest(new { message = "Invalid update payload" });

            try
            {
                var existing = await _context.Banners.FindAsync(id);
                if (existing == null) return NotFound(new { message = "Banner not found" });

                existing.Title = updated.Title ?? existing.Title;
                existing.Subtitle = updated.Subtitle ?? existing.Subtitle;
                existing.ImageUrl = updated.ImageUrl ?? existing.ImageUrl;
                existing.TargetUrl = updated.TargetUrl ?? existing.TargetUrl;
                existing.BannerType = updated.BannerType ?? existing.BannerType;
                existing.IsActive = updated.IsActive;
                existing.DisplayOrder = updated.DisplayOrder;

                await _context.SaveChangesAsync();
                return Ok(existing);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating banner", error = ex.Message });
            }
        }

        // PUT api/Banners/{id}/toggle
        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            try
            {
                var banner = await _context.Banners.FindAsync(id);
                if (banner == null) return NotFound(new { message = "Banner not found" });

                banner.IsActive = !banner.IsActive;
                await _context.SaveChangesAsync();

                return Ok(new { id = banner.Id, isActive = banner.IsActive });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error toggling banner status", error = ex.Message });
            }
        }

        // DELETE api/Banners/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var banner = await _context.Banners.FindAsync(id);
                if (banner == null) return NotFound(new { message = "Banner not found" });

                _context.Banners.Remove(banner);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Banner deleted successfully", id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting banner", error = ex.Message });
            }
        }

        // POST api/Banners/upload-image
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadBannerImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            try
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "banners");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var fileName = $"banner_{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/banners/{fileName}";
                return Ok(new { imageUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error uploading image", error = ex.Message });
            }
        }
    }
}
