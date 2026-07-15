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
    public class TestimonialsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestimonialsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ====================================================
        // GET ALL TESTIMONIALS
        // api/Testimonials
        // ====================================================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var testimonials = await _context.Testimonials
                    .OrderBy(x => x.SortOrder)
                    .ThenByDescending(x => x.CreatedDate)
                    .ToListAsync();

                return Ok(testimonials);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // GET ACTIVE TESTIMONIALS (ONLY ACTIVE, SORTED)
        // api/Testimonials/active
        // ====================================================
        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            try
            {
                var testimonials = await _context.Testimonials
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.SortOrder)
                    .ThenByDescending(x => x.CreatedDate)
                    .ToListAsync();

                return Ok(testimonials);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // GET TESTIMONIAL BY ID
        // api/Testimonials/5
        // ====================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var testimonial = await _context.Testimonials.FindAsync(id);
                if (testimonial == null)
                {
                    return NotFound(new { Message = "Testimonial not found." });
                }

                return Ok(testimonial);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // CREATE TESTIMONIAL (SUPPORTS JSON AND MULTIPART/FORM-DATA)
        // api/Testimonials
        // ====================================================
        [HttpPost]
        public async Task<IActionResult> Create()
        {
            try
            {
                Testimonial testimonial;

                if (Request.ContentType != null && Request.ContentType.Contains("application/json"))
                {
                    var body = await Request.ReadFromJsonAsync<Testimonial>();
                    if (body == null)
                    {
                        return BadRequest(new { Message = "Invalid JSON data." });
                    }
                    testimonial = body;
                }
                else
                {
                    var form = Request.Form;
                    var file = form.Files.GetFile("imageFile") ?? form.Files.GetFile("image");
                    string imageUrl = form.TryGetValue("imageUrl", out var imgUrl) ? imgUrl.ToString() : "";

                    if (file != null)
                    {
                        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/testimonials");
                        if (!Directory.Exists(uploadsDir))
                        {
                            Directory.CreateDirectory(uploadsDir);
                        }
                        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                        var filePath = Path.Combine(uploadsDir, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        imageUrl = "/uploads/testimonials/" + fileName;
                    }

                    testimonial = new Testimonial
                    {
                        Name = form.TryGetValue("name", out var name) ? name.ToString() : "",
                        Role = form.TryGetValue("role", out var role) ? role.ToString() : "",
                        Text = form.TryGetValue("text", out var text) ? text.ToString() : "",
                        ImageUrl = imageUrl,
                        Rating = form.TryGetValue("rating", out var ratingVal) && int.TryParse(ratingVal, out var rating) ? rating : 5,
                        IsActive = !form.TryGetValue("isActive", out var activeVal) || !bool.TryParse(activeVal, out var active) || active,
                        SortOrder = form.TryGetValue("sortOrder", out var sortVal) && int.TryParse(sortVal, out var sort) ? sort : 0,
                        Location = form.TryGetValue("location", out var loc) ? loc.ToString() : null,
                        CompanyName = form.TryGetValue("companyName", out var comp) ? comp.ToString() : null,
                        ProductName = form.TryGetValue("productName", out var prod) ? prod.ToString() : null
                    };
                }

                if (string.IsNullOrEmpty(testimonial.Name) || string.IsNullOrEmpty(testimonial.Role) || string.IsNullOrEmpty(testimonial.Text))
                {
                    return BadRequest(new { Message = "Name, Role, and Text are required." });
                }

                testimonial.CreatedDate = DateTime.Now;
                _context.Testimonials.Add(testimonial);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = testimonial.Id }, testimonial);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // UPDATE TESTIMONIAL (SUPPORTS JSON AND MULTIPART/FORM-DATA)
        // api/Testimonials/5
        // ====================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id)
        {
            try
            {
                var existing = await _context.Testimonials.FindAsync(id);
                if (existing == null)
                {
                    return NotFound(new { Message = "Testimonial not found." });
                }

                if (Request.ContentType != null && Request.ContentType.Contains("application/json"))
                {
                    var body = await Request.ReadFromJsonAsync<Testimonial>();
                    if (body == null)
                    {
                        return BadRequest(new { Message = "Invalid JSON data." });
                    }

                    existing.Name = body.Name;
                    existing.Role = body.Role;
                    existing.Text = body.Text;
                    existing.ImageUrl = body.ImageUrl;
                    existing.Rating = body.Rating;
                    existing.IsActive = body.IsActive;
                    existing.SortOrder = body.SortOrder;
                    existing.Location = body.Location;
                    existing.CompanyName = body.CompanyName;
                    existing.ProductName = body.ProductName;
                }
                else
                {
                    var form = Request.Form;
                    var file = form.Files.GetFile("imageFile") ?? form.Files.GetFile("image");

                    if (file != null)
                    {
                        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/testimonials");
                        if (!Directory.Exists(uploadsDir))
                        {
                            Directory.CreateDirectory(uploadsDir);
                        }
                        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                        var filePath = Path.Combine(uploadsDir, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        existing.ImageUrl = "/uploads/testimonials/" + fileName;
                    }
                    else if (form.TryGetValue("imageUrl", out var imgUrl))
                    {
                        existing.ImageUrl = imgUrl.ToString();
                    }

                    if (form.TryGetValue("name", out var name)) existing.Name = name.ToString();
                    if (form.TryGetValue("role", out var role)) existing.Role = role.ToString();
                    if (form.TryGetValue("text", out var text)) existing.Text = text.ToString();
                    if (form.TryGetValue("rating", out var ratingVal) && int.TryParse(ratingVal, out var rating)) existing.Rating = rating;
                    if (form.TryGetValue("isActive", out var activeVal) && bool.TryParse(activeVal, out var active)) existing.IsActive = active;
                    if (form.TryGetValue("sortOrder", out var sortVal) && int.TryParse(sortVal, out var sort)) existing.SortOrder = sort;
                    if (form.TryGetValue("location", out var loc)) existing.Location = loc.ToString();
                    if (form.TryGetValue("companyName", out var comp)) existing.CompanyName = comp.ToString();
                    if (form.TryGetValue("productName", out var prod)) existing.ProductName = prod.ToString();
                }

                existing.UpdatedDate = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(existing);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // DELETE TESTIMONIAL
        // api/Testimonials/5
        // ====================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var testimonial = await _context.Testimonials.FindAsync(id);
                if (testimonial == null)
                {
                    return NotFound(new { Message = "Testimonial not found." });
                }

                _context.Testimonials.Remove(testimonial);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Testimonial deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
