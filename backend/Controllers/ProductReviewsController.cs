using Microsoft.AspNetCore.Mvc;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using System.Linq;
using System.Threading.Tasks;

namespace ShyamAgroSuite.Api.Controllers
{
    [Route("api/reviews")]
    [ApiController]
    public class ProductReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper: recalculate all rating stats for a product
        private void RecalculateRatings(Product product, List<ProductReview> reviews)
        {
            product.TotalReviews  = reviews.Count;
            product.AverageRating = reviews.Count > 0
                ? Math.Round((decimal)reviews.Average(x => x.Rating), 2)
                : 0;

            product.FiveStar  = reviews.Count(x => x.Rating == 5);
            product.FourStar  = reviews.Count(x => x.Rating == 4);
            product.ThreeStar = reviews.Count(x => x.Rating == 3);
            product.TwoStar   = reviews.Count(x => x.Rating == 2);
            product.OneStar   = reviews.Count(x => x.Rating == 1);
        }

        // POST: api/reviews
        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] ProductReview review)
        {
            // Validate rating range
            if (review.Rating < 1 || review.Rating > 5)
                return BadRequest("Rating must be between 1 and 5.");

            // Validate that the ProductId exists
            var product = _context.Products.FirstOrDefault(p => p.Id == review.ProductId);
            if (product == null)
                return BadRequest($"Product with Id={review.ProductId} does not exist. Use GET /api/products to find valid product IDs.");

            _context.ProductReviews.Add(review);
            await _context.SaveChangesAsync();

            // Recalculate average rating, total reviews, and star counts
            var reviews = _context.ProductReviews
                .Where(x => x.ProductId == review.ProductId)
                .ToList();

            RecalculateRatings(product, reviews);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Review added successfully" });
        }

        // GET: api/reviews/{productId}
        [HttpGet("{productId}")]
        public IActionResult GetReviews(int productId)
        {
            var reviews = _context.ProductReviews
                .Where(x => x.ProductId == productId)
                .ToList();

            return Ok(reviews);
        }

        // DELETE: api/reviews/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var review = _context.ProductReviews.FirstOrDefault(x => x.Id == id);

            if (review == null)
                return NotFound("Review not found");

            var productId = review.ProductId;
            _context.ProductReviews.Remove(review);
            await _context.SaveChangesAsync();

            // Recalculate after deletion
            var remainingReviews = _context.ProductReviews
                .Where(x => x.ProductId == productId)
                .ToList();

            var product = _context.Products.FirstOrDefault(x => x.Id == productId);
            if (product != null)
            {
                RecalculateRatings(product, remainingReviews);
                await _context.SaveChangesAsync();
            }

            return Ok("Review deleted successfully");
        }
    }
}

