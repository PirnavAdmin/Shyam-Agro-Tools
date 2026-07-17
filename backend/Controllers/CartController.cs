using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.DTOs;

namespace ShyamAgroSuite.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CartController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string GetUserEmail()
        {
            if (User?.Identity?.IsAuthenticated == true && !string.IsNullOrEmpty(User.Identity.Name))
            {
                return User.Identity.Name;
            }

            var emailHeaderKeys = new[] { "email", "useremail", "user-email", "x-email", "x-user-email", "mobile", "mobilenumber", "phone" };
            foreach (var key in emailHeaderKeys)
            {
                var headerVal = Request.Headers.FirstOrDefault(h => h.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                if (!string.IsNullOrEmpty(headerVal))
                {
                    return headerVal.ToString();
                }
            }

            var emailQueryKeys = new[] { "email", "useremail", "mobile", "mobilenumber", "phone" };
            foreach (var key in emailQueryKeys)
            {
                var queryVal = Request.Query.FirstOrDefault(q => q.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                if (!string.IsNullOrEmpty(queryVal))
                {
                    return queryVal.ToString();
                }
            }

            var firstCustomer = _context.Customers.FirstOrDefault();
            if (firstCustomer != null && !string.IsNullOrEmpty(firstCustomer.Email))
            {
                return firstCustomer.Email;
            }

            return "test@gmail.com";
        }

        // DTOs defined inline for simplicity and robustness
        public class CartItemDto
        {
            public int ProductId { get; set; }
            public int Quantity { get; set; }
        }

        public class UpdateQuantityDto
        {
            public int Quantity { get; set; }
        }

        public class MergeCartDto
        {
            public List<CartItemDto> Items { get; set; } = new();
        }

        // ====================================================
        // GET ALL CART ITEMS (USER SPECIFIC)
        // api/Cart
        // ====================================================
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userEmail = GetUserEmail();
                var cartItems = await _context.CartItems
                    .Where(x => x.UserEmail == userEmail)
                    .OrderByDescending(x => x.CreatedDate)
                    .ToListAsync();

                var result = new List<object>();
                foreach (var item in cartItems)
                {
                    var product = await _context.Products
                        .Include(p => p.Images)
                        .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                    if (product != null)
                    {
                        decimal sellingPrice = product.SellingPrice ?? product.MRP;
                        result.Add(new
                        {
                            cartItemId = item.CartId,
                            productId = item.ProductId,
                            productName = product.ProductName,
                            sku = product.SKU,
                            imageUrl = product.Images.FirstOrDefault()?.ImageUrl ?? "/uploads/images/product.png",
                            mrp = product.MRP,
                            sellingPrice = sellingPrice,
                            quantity = item.Quantity,
                            stock = product.Stock,
                            stockStatus = product.StockStatus,
                            itemTotal = item.Quantity * sellingPrice
                        });
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // GET CART ITEM BY ID (USER SPECIFIC)
        // api/Cart/5
        // ====================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCartItem(int id)
        {
            try
            {
                var userEmail = GetUserEmail();
                var item = await _context.CartItems
                    .FirstOrDefaultAsync(x => x.CartId == id && x.UserEmail == userEmail);

                if (item == null)
                {
                    return NotFound(new
                    {
                        Message = "Cart item not found."
                    });
                }

                var product = await _context.Products
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                if (product == null)
                {
                    return NotFound(new { Message = "Product associated with this cart item no longer exists." });
                }

                decimal sellingPrice = product.SellingPrice ?? product.MRP;
                return Ok(new
                {
                    cartItemId = item.CartId,
                    productId = item.ProductId,
                    productName = product.ProductName,
                    sku = product.SKU,
                    imageUrl = product.Images.FirstOrDefault()?.ImageUrl ?? "/uploads/images/product.png",
                    mrp = product.MRP,
                    sellingPrice = sellingPrice,
                    quantity = item.Quantity,
                    stock = product.Stock,
                    stockStatus = product.StockStatus,
                    itemTotal = item.Quantity * sellingPrice
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // ADD TO CART (USER SPECIFIC, AUTOCALCULATE)
        // api/Cart
        // ====================================================
        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] CartItemDto dto)
        {
            try
            {
                var userEmail = GetUserEmail();
                if (dto.Quantity < 1)
                {
                    return BadRequest("Quantity must be at least 1.");
                }

                var product = await _context.Products.FindAsync(dto.ProductId);
                if (product == null)
                {
                    return NotFound(new { Message = "Product not found." });
                }

                if (product.Stock < dto.Quantity)
                {
                    return BadRequest(new { Message = $"Only {product.Stock} items are in stock." });
                }

                decimal price = product.SellingPrice ?? product.MRP;

                // Check if product already exists in cart
                var existingItem = await _context.CartItems
                    .FirstOrDefaultAsync(x => x.UserEmail == userEmail && x.ProductId == dto.ProductId);

                if (existingItem != null)
                {
                    int newQuantity = existingItem.Quantity + dto.Quantity;
                    if (newQuantity > product.Stock)
                    {
                        return BadRequest(new { Message = $"Cannot add requested quantity. Total in cart ({newQuantity}) would exceed available stock ({product.Stock})." });
                    }

                    existingItem.Quantity = newQuantity;
                    existingItem.Price = price;
                    existingItem.TotalAmount = existingItem.Quantity * price;
                    existingItem.TotalPrice = existingItem.TotalAmount;

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        Message = "Cart updated successfully.",
                        Data = existingItem
                    });
                }

                var newItem = new CartItem
                {
                    UserEmail = userEmail,
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    Price = price,
                    TotalAmount = dto.Quantity * price,
                    TotalPrice = dto.Quantity * price,
                    CreatedDate = DateTime.Now
                };

                _context.CartItems.Add(newItem);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Item added to cart successfully.",
                    Data = newItem
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // UPDATE CART QUANTITY (USER SPECIFIC, STOCK VALIDATION)
        // api/Cart/5
        // ====================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuantity(int id, [FromBody] UpdateQuantityDto dto)
        {
            try
            {
                var userEmail = GetUserEmail();
                if (dto.Quantity < 1)
                {
                    return BadRequest("Quantity must be at least 1.");
                }

                var existingItem = await _context.CartItems.FindAsync(id);

                if (existingItem == null || existingItem.UserEmail != userEmail)
                {
                    return NotFound(new
                    {
                        Message = "Cart item not found."
                    });
                }

                var product = await _context.Products.FindAsync(existingItem.ProductId);
                if (product == null)
                {
                    return NotFound(new { Message = "Product not found." });
                }

                if (dto.Quantity > product.Stock)
                {
                    return BadRequest(new { Message = $"Requested quantity exceeds available stock ({product.Stock})." });
                }

                decimal price = product.SellingPrice ?? product.MRP;

                existingItem.Quantity = dto.Quantity;
                existingItem.Price = price;
                existingItem.TotalAmount = dto.Quantity * price;
                existingItem.TotalPrice = existingItem.TotalAmount;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Cart updated successfully.",
                    Data = existingItem
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // DELETE CART ITEM
        // api/Cart/5
        // ====================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            try
            {
                var userEmail = GetUserEmail();
                var item = await _context.CartItems.FindAsync(id);

                if (item == null || item.UserEmail != userEmail)
                {
                    return NotFound(new
                    {
                        Message = "Cart item not found."
                    });
                }

                _context.CartItems.Remove(item);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Item removed from cart successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // CLEAR ENTIRE CART
        // api/Cart/clear
        // ====================================================
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                var userEmail = GetUserEmail();
                var items = await _context.CartItems
                    .Where(x => x.UserEmail == userEmail)
                    .ToListAsync();

                _context.CartItems.RemoveRange(items);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Cart cleared successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // MERGE CART (LOCAL STORAGE CART TO USER CART)
        // api/Cart/merge
        // ====================================================
        [HttpPost("merge")]
        public async Task<IActionResult> MergeCart([FromBody] MergeCartDto dto)
        {
            try
            {
                var userEmail = GetUserEmail();
                if (dto.Items == null || !dto.Items.Any())
                {
                    return Ok(new { Message = "No items to merge." });
                }

                foreach (var localItem in dto.Items)
                {
                    if (localItem.Quantity < 1) continue;

                    var product = await _context.Products.FindAsync(localItem.ProductId);
                    if (product == null || !product.IsActive) continue;

                    decimal price = product.SellingPrice ?? product.MRP;

                    var existingItem = await _context.CartItems
                        .FirstOrDefaultAsync(x => x.UserEmail == userEmail && x.ProductId == localItem.ProductId);

                    if (existingItem != null)
                    {
                        int newQuantity = existingItem.Quantity + localItem.Quantity;
                        if (newQuantity > product.Stock)
                        {
                            newQuantity = product.Stock; // Cap at available stock
                        }

                        existingItem.Quantity = newQuantity;
                        existingItem.Price = price;
                        existingItem.TotalAmount = newQuantity * price;
                        existingItem.TotalPrice = existingItem.TotalAmount;
                    }
                    else
                    {
                        int quantity = localItem.Quantity;
                        if (quantity > product.Stock)
                        {
                            quantity = product.Stock; // Cap at available stock
                        }

                        if (quantity > 0)
                        {
                            var newItem = new CartItem
                            {
                                UserEmail = userEmail,
                                ProductId = localItem.ProductId,
                                Quantity = quantity,
                                Price = price,
                                TotalAmount = quantity * price,
                                TotalPrice = quantity * price,
                                CreatedDate = DateTime.Now
                            };
                            _context.CartItems.Add(newItem);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                return await GetCart();
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // VALIDATE STOCK BEFORE CHECKOUT
        // api/Cart/validate-stock
        // ====================================================
        [HttpPost("validate-stock")]
        public async Task<IActionResult> ValidateStock()
        {
            try
            {
                var userEmail = GetUserEmail();
                var cartItems = await _context.CartItems
                    .Where(x => x.UserEmail == userEmail)
                    .ToListAsync();

                var issues = new List<object>();
                bool isValid = true;

                foreach (var item in cartItems)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null)
                    {
                        isValid = false;
                        issues.Add(new
                        {
                            productId = item.ProductId,
                            issue = "Product no longer exists."
                        });
                    }
                    else if (!product.IsActive)
                    {
                        isValid = false;
                        issues.Add(new
                        {
                            productId = item.ProductId,
                            productName = product.ProductName,
                            issue = "Product is inactive."
                        });
                    }
                    else if (product.Stock < 1)
                    {
                        isValid = false;
                        issues.Add(new
                        {
                            productId = item.ProductId,
                            productName = product.ProductName,
                            issue = "Product is out of stock."
                        });
                    }
                    else if (item.Quantity > product.Stock)
                    {
                        isValid = false;
                        issues.Add(new
                        {
                            productId = item.ProductId,
                            productName = product.ProductName,
                            issue = $"Requested quantity ({item.Quantity}) exceeds available stock ({product.Stock})."
                        });
                    }
                }

                return Ok(new
                {
                    isValid = isValid,
                    issues = issues
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}