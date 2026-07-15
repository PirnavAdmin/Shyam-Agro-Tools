using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.DTOs.Catalog;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/Subcategory")]
    [Route("api/Subcategories")]
    [Route("api/Catalog/subcategories")]
    public class SubcategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubcategoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Subcategory>>> GetSubcategories()
        {
            return await _context.Subcategories
                .Include(s => s.Category)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Subcategory>> GetSubcategoryById(int id)
        {
            var subcategory = await _context.Subcategories
                .Include(s => s.Category)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (subcategory == null)
            {
                return NotFound(new { Message = "Subcategory not found." });
            }
            return Ok(subcategory);
        }

        [HttpPost]
        public async Task<ActionResult<Subcategory>> CreateSubcategory([FromBody] SubcategoryUpsertRequest request)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { Message = "Subcategory name is required." });
            }

            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
            if (!categoryExists)
            {
                return BadRequest(new { Message = "Invalid Category ID." });
            }

            var subcategory = new Subcategory
            {
                CategoryId = request.CategoryId,
                Name = request.Name,
                Description = request.Description,
                IsActive = true
            };

            _context.Subcategories.Add(subcategory);
            await _context.SaveChangesAsync();

            return Ok(subcategory);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSubcategory(int id, [FromBody] SubcategoryUpsertRequest request)
        {
            var subcategory = await _context.Subcategories.FindAsync(id);
            if (subcategory == null)
            {
                return NotFound(new { Message = "Subcategory not found." });
            }

            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
            if (!categoryExists)
            {
                return BadRequest(new { Message = "Invalid Category ID." });
            }

            subcategory.CategoryId = request.CategoryId;
            subcategory.Name = request.Name;
            subcategory.Description = request.Description;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubcategory(int id)
        {
            var subcategory = await _context.Subcategories.FindAsync(id);
            if (subcategory == null)
            {
                return NotFound(new { Message = "Subcategory not found." });
            }

            // Product check removed
            var hasProducts = false;
            if (hasProducts) 
            {
                return BadRequest(new { Message = "Cannot delete subcategory because it is linked to active products. Please delete or reassign the products first." });
            }

            _context.Subcategories.Remove(subcategory);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

