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
    [Route("api/[controller]")]
    [ApiController]
    public class OrderSuccessController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrderSuccessController(ApplicationDbContext context)
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

        // ====================================================
        // PLACE ORDER (USER SPECIFIC, UNIFIED WITH CHECKOUT)
        // POST: api/OrderSuccess/place-order
        // ====================================================
        [HttpPost("place-order")]
        public async Task<IActionResult> PlaceOrder([FromBody] OrderSuccessDto dto)
        {
            try
            {
                var userEmail = GetUserEmail();

                // 1. Get cart items
                var cartItems = await _context.CartItems
                    .Where(x => x.UserEmail == userEmail)
                    .ToListAsync();

                // 2. Validate address
                var address = await _context.CustomerAddresses
                    .FirstOrDefaultAsync(x => x.AddressId == dto.CustomerAddressId);

                if (address == null)
                {
                    return BadRequest("Address not found.");
                }

                // If cart is empty, try using address email as fallback
                if (!cartItems.Any() && !string.IsNullOrEmpty(address.Email) && address.Email != userEmail)
                {
                    userEmail = address.Email;
                    cartItems = await _context.CartItems
                        .Where(x => x.UserEmail == userEmail)
                        .ToListAsync();
                }

                if (!cartItems.Any())
                {
                    return BadRequest("Cart is empty.");
                }

                // 3. Validate stock for all products
                foreach (var item in cartItems)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null)
                    {
                        return BadRequest($"Product with ID {item.ProductId} no longer exists.");
                    }
                    if (!product.IsActive)
                    {
                        return BadRequest($"Product '{product.ProductName}' is inactive.");
                    }
                    if (product.Stock < item.Quantity)
                    {
                        return BadRequest($"Insufficient stock for product '{product.ProductName}'. Available stock: {product.Stock}, requested: {item.Quantity}.");
                    }
                }

                // 4. Calculate summary
                var summaryObj = await CalculateSummaryAsync(userEmail, dto.CouponCode, dto.CoinsRedeemed);
                dynamic summary = summaryObj;

                decimal grandTotal = summary.grandTotal;
                decimal subTotal = summary.subTotal;
                decimal couponDiscount = summary.couponDiscount;
                int coinsRedeemed = summary.coinsToRedeem;
                decimal coinsDiscount = summary.coinsDiscount;

                // 5. Create order in order_success table
                var order = new OrderSuccess
                {
                    OrderId = "SAT" + DateTime.Now.ToString("yyyyMMddHHmmss"),
                    CustomerAddressId = dto.CustomerAddressId,
                    TotalAmount = grandTotal,
                    PaymentMethod = dto.PaymentMethod,
                    OrderStatus = "Placed",
                    OrderDate = DateTime.Now,
                    IsTrackEnabled = true
                };

                _context.OrderSuccesses.Add(order);

                // 6. Deduct stock from products
                foreach (var item in cartItems)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product != null)
                    {
                        product.Stock -= item.Quantity;
                    }
                }

                // 7. Update user coins (redeem and earn)
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == userEmail);
                if (customer != null)
                {
                    if (coinsRedeemed > 0)
                    {
                        customer.CoinsBalance = Math.Max(0, customer.CoinsBalance - coinsRedeemed);
                    }

                    var coinsSettings = await _context.CoinsSettings.FirstOrDefaultAsync();
                    decimal earnRate = coinsSettings?.EarnRate ?? 0.05m;
                    int earnedCoins = (int)Math.Floor(subTotal * earnRate);
                    if (earnedCoins > 0)
                    {
                        customer.CoinsBalance += earnedCoins;
                    }
                }

                // 8. Update Coupon usage
                if (couponDiscount > 0 && !string.IsNullOrEmpty(dto.CouponCode))
                {
                    var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == dto.CouponCode);
                    if (coupon != null)
                    {
                        coupon.UsedCount += 1;
                    }
                }

                // 9. Clear user's cart
                _context.CartItems.RemoveRange(cartItems);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Order Placed Successfully",
                    OrderId = order.OrderId,
                    TotalAmount = order.TotalAmount,
                    PaymentMethod = order.PaymentMethod,
                    OrderStatus = order.OrderStatus,
                    TrackOrder = $"/api/OrderSuccess/track/{order.OrderId}",
                    ContinueShopping = "/api/products",
                    OrderSummary = new
                    {
                        SubTotal = subTotal,
                        Tax = (decimal)summary.tax,
                        CouponDiscount = couponDiscount,
                        CoinsDiscount = coinsDiscount,
                        GrandTotal = grandTotal
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // TRACK ORDER
        // ====================================================
        [HttpGet("track/{orderId}")]
        public async Task<IActionResult> TrackOrder(string orderId)
        {
            var order = await _context.OrderSuccesses
                .FirstOrDefaultAsync(x => x.OrderId == orderId);

            if (order == null)
                return NotFound("Order not found.");

            return Ok(order);
        }

        // ====================================================
        // GET ORDER SUCCESS SCREEN DATA
        // ====================================================
        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetOrderSuccess(string orderId)
        {
            var order = await _context.OrderSuccesses
                .FirstOrDefaultAsync(x => x.OrderId == orderId);

            if (order == null)
                return NotFound();

            return Ok(new
            {
                OrderId = order.OrderId,
                TotalAmount = order.TotalAmount,
                PaymentMethod = order.PaymentMethod,
                OrderStatus = order.OrderStatus
            });
        }

        private async Task<object> CalculateSummaryAsync(string userEmail, string? couponCode, int? coinsToRedeem)
        {
            var cartItems = await _context.CartItems
                .Where(x => x.UserEmail == userEmail)
                .ToListAsync();

            decimal subTotal = 0;

            foreach (var item in cartItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    subTotal += item.Quantity * (product.SellingPrice ?? product.MRP);
                }
            }

            decimal tax = Math.Round(subTotal * 0.18m, 2);
            decimal shippingCharges = 0;

            decimal couponDiscount = 0;
            if (!string.IsNullOrEmpty(couponCode))
            {
                var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == couponCode && c.IsActive);
                if (coupon != null && subTotal >= coupon.MinCartValue && DateTime.UtcNow >= coupon.StartDate && DateTime.UtcNow <= coupon.EndDate && coupon.UsedCount < coupon.UsageLimit)
                {
                    if (coupon.DiscountType.Equals("Percentage", StringComparison.OrdinalIgnoreCase))
                    {
                        couponDiscount = Math.Round(subTotal * (coupon.DiscountValue / 100.0m), 2);
                    }
                    else
                    {
                        couponDiscount = coupon.DiscountValue;
                    }

                    if (couponDiscount > subTotal)
                    {
                        couponDiscount = subTotal;
                    }
                }
            }

            var coinsSettings = await _context.CoinsSettings.FirstOrDefaultAsync();
            decimal conversionRate = coinsSettings?.ConversionRate ?? 1.0m;

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == userEmail);
            int availableCoins = customer?.CoinsBalance ?? 500;

            decimal coinsDiscount = 0;
            int coinsRedeemed = 0;

            if (coinsToRedeem.HasValue && coinsToRedeem.Value > 0)
            {
                coinsRedeemed = Math.Min(coinsToRedeem.Value, availableCoins);
                var minRedeem = coinsSettings?.MinRedeemableCoins ?? 100;
                var maxRedeem = coinsSettings?.MaxRedeemableCoins ?? 5000;
                if (coinsRedeemed >= minRedeem)
                {
                    coinsRedeemed = Math.Min(coinsRedeemed, maxRedeem);
                    coinsDiscount = Math.Round(coinsRedeemed * conversionRate, 2);
                }
                else
                {
                    coinsRedeemed = 0;
                }
            }

            decimal totalBeforeCoins = subTotal + tax + shippingCharges - couponDiscount;
            if (coinsDiscount > totalBeforeCoins)
            {
                coinsDiscount = totalBeforeCoins;
                coinsRedeemed = (int)Math.Ceiling(coinsDiscount / conversionRate);
            }

            decimal grandTotal = totalBeforeCoins - coinsDiscount;
            if (grandTotal < 0) grandTotal = 0;

            return new
            {
                subTotal = subTotal,
                tax = tax,
                couponDiscount = couponDiscount,
                availableCoins = availableCoins,
                coinsToRedeem = coinsRedeemed,
                coinsDiscount = coinsDiscount,
                grandTotal = grandTotal
            };
        }
    }
}