using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.DTOs.Blog;
using ShyamAgroSuite.Api.Services.Interfaces;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BlogController : ControllerBase
    {
        private readonly IBlogService _service;
        private readonly ApplicationDbContext _context;

        public BlogController(IBlogService service, ApplicationDbContext context)
        {
            _service = service;
            _context = context;
        }

        // GET: api/blog
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var blogs = await _service.GetAllAsync();
            return Ok(blogs);
        }

        // GET: api/blog/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var blog = await _service.GetByIdAsync(id);

            if (blog == null)
                return NotFound(new { message = "Blog not found." });

            return Ok(blog);
        }

        // POST: api/blog
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateBlogDto dto)
        {
            var result = await _service.CreateAsync(dto);

            // Add notification
            var notification = new Notification
            {
                Title = "Blog Created",
                Message = $"New blog '{result.Title}' published.",
                Type = "BlogCreated"
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById),
                new { id = result.Id },
                result);
        }

        // PUT: api/blog/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id,
            [FromForm] UpdateBlogDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);

            if (!updated)
                return NotFound(new { message = "Blog not found." });

            return Ok(new
            {
                message = "Blog updated successfully."
            });
        }

        // DELETE: api/blog/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);

            if (!deleted)
                return NotFound(new { message = "Blog not found." });

            return Ok(new
            {
                message = "Blog deleted successfully."
            });
        }
    }
}

