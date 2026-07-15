using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WalletController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WalletController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Phone normalization helper: extracts last 10 digits if starts with 91 or +91
        private string NormalizePhone(string phone)
        {
            if (string.IsNullOrEmpty(phone)) return string.Empty;
            var cleaned = new string(phone.Where(char.IsDigit).ToArray());
            if (cleaned.Length > 10 && cleaned.StartsWith("91"))
            {
                return cleaned.Substring(cleaned.Length - 10);
            }
            return cleaned.Length >= 10 ? cleaned.Substring(cleaned.Length - 10) : cleaned;
        }

        // Lookup customer by normalized phone or email fallback (for admin)
        private async Task<Customer?> GetCustomerByIdentityAsync(string identityName)
        {
            if (string.IsNullOrEmpty(identityName)) return null;

            if (identityName.Contains("@"))
            {
                return await _context.Customers.FirstOrDefaultAsync(c => c.Email == identityName);
            }

            var target = NormalizePhone(identityName);
            if (string.IsNullOrEmpty(target)) return null;

            var customers = await _context.Customers.ToListAsync();
            return customers.FirstOrDefault(c => NormalizePhone(c.Phone) == target);
        }

        // Auto-create customer profile using claims retrieved from JWT token
        private async Task<Customer> AutoCreateCustomerAsync(string identityName)
        {
            string phone = "";
            string email = "";
            string fullName = "Valued Customer";

            if (identityName.Contains("@"))
            {
                email = identityName;
                fullName = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Name)?.Value ?? "Admin User";
            }
            else
            {
                phone = identityName;
                fullName = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.GivenName)?.Value ?? "Valued Customer";
                email = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value ?? string.Empty;

                var normalized = NormalizePhone(phone);
                var testUsers = await _context.TestUsers.ToListAsync();
                var matchedUser = testUsers.FirstOrDefault(u => u.MobileNumber != null && NormalizePhone(u.MobileNumber) == normalized);

                if (matchedUser != null)
                {
                    fullName = matchedUser.FullName ?? fullName;
                    email = matchedUser.Email ?? email;
                }
            }

            var customer = new Customer
            {
                Phone = phone,
                Name = string.IsNullOrEmpty(fullName) ? "Valued Customer" : fullName,
                Email = email,
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                CoinsBalance = 0,
                Address = string.Empty,
                District = string.Empty,
                State = string.Empty,
                ProfilePicture = string.Empty
            };

            if (!string.IsNullOrEmpty(phone))
            {
                var normalized = NormalizePhone(phone);
                var testUsers = await _context.TestUsers.ToListAsync();
                var matchedUser = testUsers.FirstOrDefault(u => u.MobileNumber != null && NormalizePhone(u.MobileNumber) == normalized);
                if (matchedUser != null)
                {
                    customer.Address = $"{matchedUser.DoorNo} {matchedUser.StreetArea}".Trim();
                    customer.District = matchedUser.City ?? string.Empty;
                    customer.State = matchedUser.State ?? string.Empty;
                    customer.ProfilePicture = matchedUser.ProfileImageUrl ?? string.Empty;
                }
            }

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return customer;
        }

        // 1. GET: api/Wallet
        [HttpGet]
        public async Task<IActionResult> GetWallet()
        {
            var identityName = User.Identity?.Name;
            if (string.IsNullOrEmpty(identityName))
                return Unauthorized("User is not authenticated.");

            var customer = await GetCustomerByIdentityAsync(identityName);
            if (customer == null)
            {
                customer = await AutoCreateCustomerAsync(identityName);
            }

            var settings = await _context.CoinsSettings.FirstOrDefaultAsync() ?? new CoinsSettings();

            var txs = await _context.WalletTransactions
                .Where(t => t.CustomerId == customer.Id)
                .ToListAsync();

            int totalEarned = txs.Where(t => t.Type == "Credit" && t.Source != "WelcomeBonus").Sum(t => t.Coins);
            int totalRedeemed = txs.Where(t => t.Type == "Debit").Sum(t => t.Coins);
            int welcomeBonus = txs.Where(t => t.Source == "WelcomeBonus").Sum(t => t.Coins);
            int expired = txs.Where(t => t.Source == "Expired").Sum(t => t.Coins);

            // Total earned includes welcome bonus for display
            int finalTotalEarned = totalEarned + welcomeBonus;

            return Ok(new
            {
                customerId = customer.Id,
                userId = customer.UserId ?? customer.Id,
                userPhone = customer.Phone,
                availableCoins = customer.CoinsBalance,
                totalEarnedCoins = finalTotalEarned,
                totalRedeemedCoins = totalRedeemed,
                expiredCoins = expired,
                conversionRate = settings.ConversionRate,
                lastUpdated = DateTime.UtcNow
            });
        }

        // 2. GET: api/Wallet/transactions
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions()
        {
            var identityName = User.Identity?.Name;
            if (string.IsNullOrEmpty(identityName))
                return Unauthorized("User is not authenticated.");

            var customer = await GetCustomerByIdentityAsync(identityName);
            if (customer == null)
            {
                customer = await AutoCreateCustomerAsync(identityName);
            }

            var txs = await _context.WalletTransactions
                .Where(t => t.CustomerId == customer.Id)
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();

            return Ok(txs);
        }

        // 3. POST: api/Wallet/welcome-bonus
        [HttpPost("welcome-bonus")]
        public async Task<IActionResult> ApplyWelcomeBonus()
        {
            var identityName = User.Identity?.Name;
            if (string.IsNullOrEmpty(identityName))
                return Unauthorized("User is not authenticated.");

            var customer = await GetCustomerByIdentityAsync(identityName);
            if (customer == null)
            {
                customer = await AutoCreateCustomerAsync(identityName);
            }

            // Check if welcome bonus is already applied
            var alreadyApplied = await _context.WalletTransactions
                .AnyAsync(t => t.CustomerId == customer.Id && t.Source == "WelcomeBonus");

            if (alreadyApplied)
            {
                return Ok(new
                {
                    success = true,
                    message = "Welcome bonus already applied",
                    availableCoins = customer.CoinsBalance
                });
            }

            var settings = await _context.CoinsSettings.FirstOrDefaultAsync() ?? new CoinsSettings();
            if (!settings.IsWelcomeBonusEnabled)
            {
                return BadRequest(new { Success = false, message = "Welcome bonus program is currently disabled." });
            }

            // Apply Welcome Bonus
            int bonus = settings.WelcomeBonusCoins;
            var tx = new WalletTransaction
            {
                CustomerId = customer.Id,
                Type = "Credit",
                Source = "WelcomeBonus",
                Title = "Welcome Bonus",
                Description = $"{bonus} coins added for joining Shyam Agro Tools",
                Coins = bonus,
                OrderId = null,
                CreatedDate = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(settings.CoinValidityDays)
            };

            _context.WalletTransactions.Add(tx);
            customer.CoinsBalance += bonus;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Welcome bonus applied",
                availableCoins = customer.CoinsBalance
            });
        }

        // 4. POST: api/Wallet/validate-redeem
        [HttpPost("validate-redeem")]
        public async Task<IActionResult> ValidateRedeem([FromBody] ValidateRedeemRequest request)
        {
            var identityName = User.Identity?.Name;
            if (string.IsNullOrEmpty(identityName))
                return Unauthorized("User is not authenticated.");

            var customer = await GetCustomerByIdentityAsync(identityName);
            if (customer == null)
            {
                customer = await AutoCreateCustomerAsync(identityName);
            }

            var settings = await _context.CoinsSettings.FirstOrDefaultAsync() ?? new CoinsSettings();

            int available = customer.CoinsBalance;

            if (available < settings.MinRedeemableCoins)
            {
                return Ok(new
                {
                    isValid = false,
                    availableCoins = available,
                    redeemableCoins = 0,
                    coinsDiscount = 0,
                    message = $"Minimum {settings.MinRedeemableCoins} coins required to redeem"
                });
            }

            // Cap requested coins to available balance
            int toRedeem = Math.Min(request.RequestedCoins, available);

            // Cap by maximum redeemable settings limit
            toRedeem = Math.Min(toRedeem, settings.MaxRedeemableCoins);

            // Cap by cart percent limit (20% of cart total)
            decimal maxPercentVal = request.CartTotal * (settings.MaxCartRedeemPercent / 100m);
            int maxPercentCoins = (int)Math.Floor(maxPercentVal / settings.ConversionRate);
            toRedeem = Math.Min(toRedeem, maxPercentCoins);

            decimal discount = toRedeem * settings.ConversionRate;

            if (toRedeem < settings.MinRedeemableCoins)
            {
                return Ok(new
                {
                    isValid = false,
                    availableCoins = available,
                    redeemableCoins = 0,
                    coinsDiscount = 0,
                    message = $"Redemption amount is below minimum threshold of {settings.MinRedeemableCoins} coins."
                });
            }

            return Ok(new
            {
                isValid = true,
                availableCoins = available,
                redeemableCoins = toRedeem,
                coinsDiscount = discount,
                conversionRate = settings.ConversionRate,
                maxCartRedeemPercent = settings.MaxCartRedeemPercent,
                minRedeemableCoins = settings.MinRedeemableCoins,
                maxRedeemableCoins = settings.MaxRedeemableCoins,
                message = "Coins can be redeemed"
            });
        }

        // 5. POST: api/Wallet/calculate-earned
        [AllowAnonymous]
        [HttpPost("calculate-earned")]
        public async Task<IActionResult> CalculateEarned([FromBody] CalculateEarnedRequest request)
        {
            var settings = await _context.CoinsSettings.FirstOrDefaultAsync() ?? new CoinsSettings();

            int earned = 0;
            if (request.OrderAmount >= settings.MinimumOrderValue)
            {
                earned = (int)Math.Floor(request.OrderAmount / (decimal)settings.RupeesRequiredForOneCoin);
            }

            return Ok(new
            {
                orderAmount = request.OrderAmount,
                earnedCoins = earned,
                formula = $"floor(orderAmount / {settings.RupeesRequiredForOneCoin})"
            });
        }
    }

    public class ValidateRedeemRequest
    {
        public decimal CartTotal { get; set; }
        public int RequestedCoins { get; set; }
    }

    public class CalculateEarnedRequest
    {
        public decimal OrderAmount { get; set; }
    }
}
