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
    public class CheckoutController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CheckoutController(ApplicationDbContext context)
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

        public class CheckoutSummaryRequest
        {
            public string? CouponCode { get; set; }
            public int? CoinsToRedeem { get; set; }
            public int? CoinsRedeemed { get; set; }
            public int? AddressId { get; set; }
            public int? CustomerAddressId { get; set; }
        }

        // ====================================================
        // GET CHECKOUT SUMMARY (USER SPECIFIC)
        // GET: api/Checkout/summary
        // ====================================================
        [HttpGet("summary")]
        public async Task<IActionResult> GetCheckoutSummary([FromQuery] string? couponCode, [FromQuery] int? coinsRedeemed)
        {
            try
            {
                var userEmail = GetUserEmail();
                var summary = await CalculateSummaryAsync(userEmail, couponCode, coinsRedeemed);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // POST CHECKOUT SUMMARY (USER SPECIFIC)
        // POST: api/Checkout/summary
        // ====================================================
        [HttpPost("summary")]
        public async Task<IActionResult> PostCheckoutSummary([FromBody] CheckoutSummaryRequest request)
        {
            try
            {
                var userEmail = GetUserEmail();
                int? coins = request.CoinsRedeemed ?? request.CoinsToRedeem;
                var summary = await CalculateSummaryAsync(userEmail, request.CouponCode, coins);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // ====================================================
        // PLACE ORDER (USER SPECIFIC, STOCK & CART VALIDATION)
        // POST: api/Checkout/place-order
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
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == userEmail || c.Phone == userEmail);
                int earnedCoins = 0;

                if (customer != null)
                {
                    // Deduct redeemed coins
                    if (coinsRedeemed > 0)
                    {
                        customer.CoinsBalance = Math.Max(0, customer.CoinsBalance - coinsRedeemed);

                        var debitTx = new WalletTransaction
                        {
                            CustomerId = customer.Id,
                            Type = "Debit",
                            Source = "Redeemed",
                            Title = "Coins Redeemed",
                            Description = $"{coinsRedeemed} coins redeemed for order {order.OrderId}",
                            Coins = coinsRedeemed,
                            OrderId = order.OrderId,
                            CreatedDate = DateTime.UtcNow,
                            ExpiresAt = null
                        };
                        _context.WalletTransactions.Add(debitTx);
                    }

                    // Earn new coins: floor(grandTotal / RupeesRequiredForOneCoin)
                    var coinsSettings = await _context.CoinsSettings.FirstOrDefaultAsync() ?? new CoinsSettings();
                    if (grandTotal >= coinsSettings.MinimumOrderValue)
                    {
                        earnedCoins = (int)Math.Floor(grandTotal / (decimal)coinsSettings.RupeesRequiredForOneCoin);
                        if (earnedCoins > 0)
                        {
                            customer.CoinsBalance += earnedCoins;

                            var creditTx = new WalletTransaction
                            {
                                CustomerId = customer.Id,
                                Type = "Credit",
                                Source = "Earned",
                                Title = "Coins Earned",
                                Description = $"{earnedCoins} coins earned from order {order.OrderId}",
                                Coins = earnedCoins,
                                OrderId = order.OrderId,
                                CreatedDate = DateTime.UtcNow,
                                ExpiresAt = DateTime.UtcNow.AddDays(coinsSettings.CoinValidityDays)
                            };
                            _context.WalletTransactions.Add(creditTx);
                        }
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
                    success = true,
                    orderId = order.OrderId,
                    paymentMethod = order.PaymentMethod,
                    paymentStatus = dto.PaymentStatus ?? "Pending",
                    orderStatus = order.OrderStatus,
                    orderSummary = new
                    {
                        subTotal = subTotal,
                        tax = (decimal)summary.tax,
                        couponDiscount = couponDiscount,
                        coinsRedeemed = coinsRedeemed,
                        coinsDiscount = coinsDiscount,
                        grandTotal = grandTotal
                    },
                    wallet = new
                    {
                        coinsRedeemed = coinsRedeemed,
                        coinsEarned = earnedCoins,
                        availableCoins = customer?.CoinsBalance ?? 0
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        private async Task<object> CalculateSummaryAsync(string userEmail, string? couponCode, int? coinsToRedeem)
        {
            var cartItems = await _context.CartItems
                .Where(x => x.UserEmail == userEmail)
                .ToListAsync();

            var cartDetails = new List<object>();
            decimal subTotal = 0;
            int totalItems = 0;

            foreach (var item in cartItems)
            {
                var product = await _context.Products
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                if (product != null)
                {
                    decimal sellingPrice = product.SellingPrice ?? product.MRP;
                    decimal itemTotal = item.Quantity * sellingPrice;
                    subTotal += itemTotal;
                    totalItems += item.Quantity;

                    cartDetails.Add(new
                    {
                        cartItemId = item.CartId,
                        productId = item.ProductId,
                        productName = product.ProductName,
                        imageUrl = product.Images.FirstOrDefault()?.ImageUrl ?? "/uploads/images/product.png",
                        quantity = item.Quantity,
                        sellingPrice = sellingPrice,
                        itemTotal = itemTotal
                    });
                }
            }

            // Tax calculations (18% total: 9% CGST + 9% SGST)
            decimal tax = Math.Round(subTotal * 0.18m, 2);
            decimal cgst = Math.Round(subTotal * 0.09m, 2);
            decimal sgst = Math.Round(subTotal * 0.09m, 2);
            decimal shippingCharges = 0; // Flat or free

            // Fetch coupon discount
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

            // Fetch coins settings
            var coinsSettings = await _context.CoinsSettings.FirstOrDefaultAsync() ?? new CoinsSettings();
            decimal conversionRate = coinsSettings.ConversionRate;
            int minRedeem = coinsSettings.MinRedeemableCoins;
            int maxRedeem = coinsSettings.MaxRedeemableCoins;

            // Retrieve customer's available coins
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == userEmail || c.Phone == userEmail);
            int availableCoins = customer?.CoinsBalance ?? 0;

            decimal coinsDiscount = 0;
            int coinsRedeemed = 0;

            if (coinsToRedeem.HasValue && coinsToRedeem.Value > 0 && availableCoins >= minRedeem)
            {
                coinsRedeemed = Math.Min(coinsToRedeem.Value, availableCoins);
                
                // Cap by max redeem limit
                coinsRedeemed = Math.Min(coinsRedeemed, maxRedeem);

                // Cap by cart percent limit (20% of cart total)
                decimal maxPercentVal = subTotal * (coinsSettings.MaxCartRedeemPercent / 100m);
                int maxPercentCoins = (int)Math.Floor(maxPercentVal / conversionRate);
                coinsRedeemed = Math.Min(coinsRedeemed, maxPercentCoins);

                if (coinsRedeemed >= minRedeem)
                {
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
                cartItems = cartDetails,
                subTotal = subTotal,
                cgst = cgst,
                sgst = sgst,
                tax = tax,
                shippingCharges = shippingCharges,
                couponDiscount = couponDiscount,
                availableCoins = availableCoins,
                coinsRedeemed = coinsRedeemed, // Add explicit coinsRedeemed for mobile app expected response
                coinsToRedeem = coinsRedeemed,
                coinsDiscount = coinsDiscount,
                grandTotal = grandTotal,
                totalItems = totalItems
            };
        }
    }
}