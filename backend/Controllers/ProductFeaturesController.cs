using Microsoft.AspNetCore.Mvc;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using System.Linq;
using System.Threading.Tasks;

namespace ShyamAgroSuite.Api.Controllers
{
    [Route("api/features")]
    [ApiController]
    public class ProductFeaturesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductFeaturesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/features
        [HttpPost]
        public async Task<IActionResult> AddFeature([FromBody] ProductFeature feature)
        {
            // Validate that the ProductId exists
            var productExists = _context.Products.Any(p => p.Id == feature.ProductId);
            if (!productExists)
                return BadRequest($"Product with Id={feature.ProductId} does not exist. Use GET /api/products to find valid product IDs.");

            _context.ProductFeatures.Add(feature);
            await _context.SaveChangesAsync();

            return Ok("Feature added successfully");
        }

        // GET: api/features/{productId}
        [HttpGet("{productId}")]
        public IActionResult GetFeatures(int productId)
        {
            var features = _context.ProductFeatures
                .Where(x => x.ProductId == productId)
                .ToList();

            return Ok(features);
        }

        // DELETE: api/features/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFeature(int id)
        {
            var feature = _context.ProductFeatures.FirstOrDefault(x => x.Id == id);

            if (feature == null)
                return NotFound("Feature not found");

            _context.ProductFeatures.Remove(feature);
            await _context.SaveChangesAsync();

            return Ok("Feature deleted successfully");
        }
    }
}

