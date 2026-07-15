using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WishlistController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WishlistController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string? GetUserPhone()
        {
            // 1. Check JWT claims for phone/mobile first, then name/email
            if (User?.Identity?.IsAuthenticated == true)
            {
                // Try to find mobile/phone claim first
                var phoneClaim = User.Claims.FirstOrDefault(c => c.Type.Equals("phone", StringComparison.OrdinalIgnoreCase) || 
                                                                 c.Type.Equals("mobile", StringComparison.OrdinalIgnoreCase) || 
                                                                 c.Type.Equals("mobileNumber", StringComparison.OrdinalIgnoreCase))?.Value;
                if (!string.IsNullOrEmpty(phoneClaim))
                {
                    return phoneClaim;
                }
                
                // Fallback to name claim (which might hold the email/username identifier)
                if (!string.IsNullOrEmpty(User.Identity.Name))
                {
                    return User.Identity.Name;
                }
            }

            // 2. Check headers for phone/mobile, then email
            var phoneHeaderKeys = new[] { "phone", "mobile", "mobilenumber", "email", "useremail", "user-email", "x-email", "x-user-email" };
            foreach (var key in phoneHeaderKeys)
            {
                var headerVal = Request.Headers.FirstOrDefault(h => h.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                if (!string.IsNullOrEmpty(headerVal))
                {
                    return headerVal.ToString();
                }
            }

            // 3. Check query parameters for phone/mobile, then email
            var phoneQueryKeys = new[] { "phone", "mobile", "mobilenumber", "email", "useremail" };
            foreach (var key in phoneQueryKeys)
            {
                var queryVal = Request.Query.FirstOrDefault(q => q.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                if (!string.IsNullOrEmpty(queryVal))
                {
                    return queryVal.ToString();
                }
            }

            return null;
        }

        public class AddWishlistDto
        {
            public int ProductId { get; set; }
        }

        // GET: api/Wishlist
        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var userPhone = GetUserPhone();
            if (string.IsNullOrEmpty(userPhone))
            {
                return Ok(new System.Collections.Generic.List<object>());
            }

            var items = await _context.WishlistItems
                .Include(w => w.Product)
                    .ThenInclude(p => p.Images)
                .Where(w => w.UserPhone == userPhone)
                .ToListAsync();

            var response = items.Select(w => new
            {
                wishlistId = w.Id,
                productId = w.ProductId,
                productName = w.Product?.ProductName,
                sku = w.Product?.SKU,
                imageUrl = w.Product?.Images.FirstOrDefault()?.ImageUrl,
                mrp = w.Product?.MRP ?? 0,
                sellingPrice = w.Product?.SellingPrice ?? w.Product?.MRP ?? 0,
                stock = w.Product?.Stock ?? 0,
                stockStatus = w.Product?.StockStatus,
                createdDate = w.CreatedDate
            });

            return Ok(response);
        }

        // GET: api/Wishlist/count
        [HttpGet("count")]
        public async Task<IActionResult> GetWishlistCount()
        {
            var userPhone = GetUserPhone();
            if (string.IsNullOrEmpty(userPhone))
            {
                return Ok(new { count = 0 });
            }

            var count = await _context.WishlistItems
                .CountAsync(w => w.UserPhone == userPhone);

            return Ok(new { count });
        }

        // POST: api/Wishlist
        [HttpPost]
        public async Task<IActionResult> AddToWishlist([FromBody] AddWishlistDto dto)
        {
            var userPhone = GetUserPhone();
            if (string.IsNullOrEmpty(userPhone))
            {
                return Unauthorized("User identity not found.");
            }

            // Validate product exists
            var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
            if (!productExists)
            {
                return BadRequest("Product not found.");
            }

            // Check if already in wishlist
            var existing = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserPhone == userPhone && w.ProductId == dto.ProductId);

            if (existing != null)
            {
                return Ok(new { success = true, message = "Product already exists in wishlist" });
            }

            var item = new WishlistItem
            {
                UserPhone = userPhone,
                ProductId = dto.ProductId,
                CreatedDate = DateTime.UtcNow
            };

            _context.WishlistItems.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Product added to wishlist" });
        }

        // DELETE: api/Wishlist/{productId}
        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            var userPhone = GetUserPhone();
            if (string.IsNullOrEmpty(userPhone))
            {
                return Unauthorized("User identity not found.");
            }

            var item = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserPhone == userPhone && w.ProductId == productId);

            if (item == null)
            {
                return NotFound("Product not found in wishlist.");
            }

            _context.WishlistItems.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Product removed from wishlist" });
        }

        // DELETE: api/Wishlist/clear
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearWishlist()
        {
            var userPhone = GetUserPhone();
            if (string.IsNullOrEmpty(userPhone))
            {
                return Unauthorized("User identity not found.");
            }

            var items = await _context.WishlistItems
                .Where(w => w.UserPhone == userPhone)
                .ToListAsync();

            _context.WishlistItems.RemoveRange(items);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Wishlist cleared successfully" });
        }

        // GET: api/Wishlist/check/{productId}
        [HttpGet("check/{productId}")]
        public async Task<IActionResult> CheckWishlist(int productId)
        {
            var userPhone = GetUserPhone();
            if (string.IsNullOrEmpty(userPhone))
            {
                return Ok(new { isInWishlist = false });
            }

            var exists = await _context.WishlistItems
                .AnyAsync(w => w.UserPhone == userPhone && w.ProductId == productId);

            return Ok(new { isInWishlist = exists });
        }
    }
}
