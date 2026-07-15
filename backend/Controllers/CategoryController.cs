using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.DTOs.Catalog;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/Category")]
    [Route("api/Categories")]
    [Route("api/Catalog/categories")]
    public class CategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static readonly System.Text.Json.JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public CategoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        private async Task<string?> SaveUploadedFileAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return null;

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            var request = HttpContext.Request;
            var hostUrl = $"{request.Scheme}://{request.Host}";
            return $"{hostUrl}/uploads/{uniqueFileName}";
        }

        private string GetFormValue(IFormCollection form, string key)
        {
            if (form.TryGetValue(key, out var val)) return val.ToString();
            foreach (var k in form.Keys)
            {
                if (k.Equals(key, StringComparison.OrdinalIgnoreCase))
                {
                    return form[k].ToString();
                }
            }
            return string.Empty;
        }

        private IFormFile? GetFormFile(IFormCollection form, string key)
        {
            var file = form.Files.GetFile(key);
            if (file != null) return file;
            foreach (var f in form.Files)
            {
                if (f.Name.Equals(key, StringComparison.OrdinalIgnoreCase))
                {
                    return f;
                }
            }
            return null;
        }

        private async Task<CategoryUpsertRequest> GetCategoryRequestAsync()
        {
            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                
                Console.WriteLine("--- Category Form Keys ---");
                foreach (var k in form.Keys)
                {
                    Console.WriteLine($"{k}: {form[k]}");
                }

                var name = GetFormValue(form, "Name");
                if (string.IsNullOrEmpty(name)) name = GetFormValue(form, "categoryName");
                if (string.IsNullOrEmpty(name)) name = GetFormValue(form, "CategoryName");
                if (string.IsNullOrEmpty(name)) name = GetFormValue(form, "category_name");
                if (string.IsNullOrEmpty(name)) name = GetFormValue(form, "category");

                var desc = GetFormValue(form, "Description");
                if (string.IsNullOrEmpty(desc)) desc = GetFormValue(form, "categoryDescription");
                if (string.IsNullOrEmpty(desc)) desc = GetFormValue(form, "category_description");

                var imgUrl = GetFormValue(form, "ImageUrl");
                if (string.IsNullOrEmpty(imgUrl)) imgUrl = GetFormValue(form, "image");

                return new CategoryUpsertRequest
                {
                    Name = name,
                    Description = desc,
                    ImageUrl = imgUrl,
                    ImageFile = GetFormFile(form, "ImageFile") ?? GetFormFile(form, "image") ?? GetFormFile(form, "file")
                };
            }
            else
            {
                try
                {
                    Request.EnableBuffering();
                    using (var reader = new StreamReader(Request.Body, Encoding.UTF8, true, 1024, true))
                    {
                        var bodyStr = await reader.ReadToEndAsync();
                        Console.WriteLine($"--- Category JSON Body --- \n{bodyStr}");
                    }
                    Request.Body.Position = 0;

                    var dict = await Request.ReadFromJsonAsync<Dictionary<string, object>>(_jsonOptions);

                    string GetVal(string key, string? alt1 = null, string? alt2 = null, string? alt3 = null, string? alt4 = null)
                    {
                        if (dict == null) return string.Empty;
                        string Match(string k)
                        {
                            foreach (var dk in dict.Keys)
                            {
                                if (dk.Equals(k, StringComparison.OrdinalIgnoreCase))
                                {
                                    return dict[dk]?.ToString() ?? string.Empty;
                                }
                            }
                            return string.Empty;
                        }
                        var v = Match(key);
                        if (string.IsNullOrEmpty(v) && alt1 != null) v = Match(alt1);
                        if (string.IsNullOrEmpty(v) && alt2 != null) v = Match(alt2);
                        if (string.IsNullOrEmpty(v) && alt3 != null) v = Match(alt3);
                        if (string.IsNullOrEmpty(v) && alt4 != null) v = Match(alt4);
                        return v;
                    }

                    return new CategoryUpsertRequest
                    {
                        Name = GetVal("Name", "categoryName", "CategoryName", "category_name", "category"),
                        Description = GetVal("Description", "categoryDescription", "category_description", "description"),
                        ImageUrl = GetVal("ImageUrl", "image")
                    };
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Category parsing failed: {ex.Message}");
                    return new CategoryUpsertRequest();
                }
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            var categories = await _context.Categories
                .Include(c => c.Subcategories)
                .ToListAsync();
            return Ok(categories);
        }

        [HttpPost]
        public async Task<ActionResult<Category>> CreateCategory([FromForm] CategoryUpsertRequest formRequest)
        {
            var request = await GetCategoryRequestAsync();
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { Message = "Category name is required." });
            }

            var uploadedUrl = await SaveUploadedFileAsync(request.ImageFile);
            var finalImageUrl = uploadedUrl ?? request.ImageUrl ?? "";

            var category = new Category
            {
                Name = request.Name,
                Description = request.Description,
                ImageUrl = finalImageUrl,
                IsActive = true
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromForm] CategoryUpsertRequest formRequest)
        {
            var request = await GetCategoryRequestAsync();
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { Message = "Category not found." });
            }

            var uploadedUrl = await SaveUploadedFileAsync(request.ImageFile);
            var finalImageUrl = uploadedUrl ?? request.ImageUrl;

            category.Name = request.Name;
            category.Description = request.Description;
            if (!string.IsNullOrEmpty(finalImageUrl))
            {
                category.ImageUrl = finalImageUrl;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { Message = "Category not found." });
            }

            var hasSubcategories = await _context.Subcategories.AnyAsync(s => s.CategoryId == id);
            if (hasSubcategories)
            {
                return BadRequest(new { Message = "Cannot delete category because it contains active subcategories. Please delete the subcategories first." });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

