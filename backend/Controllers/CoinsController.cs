using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoinsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CoinsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Coins
        [HttpGet]
        public async Task<ActionResult<CoinsSettings>> GetSettings()
        {
            var settings = await _context.CoinsSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CoinsSettings
                {
                    ConversionRate = 1.0m,
                    EarnRate = 0.05m,
                    MinRedeemableCoins = 100,
                    MaxRedeemableCoins = 5000,
                    RupeesRequiredForOneCoin = 20,
                    MinimumOrderValue = 100.00m,
                    MaxCartRedeemPercent = 20.00m,
                    WelcomeBonusCoins = 25,
                    CoinValidityDays = 180,
                    IsWelcomeBonusEnabled = true,
                    IsActive = true
                };
                _context.CoinsSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return Ok(settings);
        }

        // PUT: api/Coins
        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] CoinsSettings updateData)
        {
            var settings = await _context.CoinsSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CoinsSettings();
                _context.CoinsSettings.Add(settings);
            }

            settings.ConversionRate = updateData.ConversionRate;
            settings.EarnRate = updateData.EarnRate;
            settings.MinRedeemableCoins = updateData.MinRedeemableCoins;
            settings.MaxRedeemableCoins = updateData.MaxRedeemableCoins;
            settings.RupeesRequiredForOneCoin = updateData.RupeesRequiredForOneCoin;
            settings.MinimumOrderValue = updateData.MinimumOrderValue;
            settings.MaxCartRedeemPercent = updateData.MaxCartRedeemPercent;
            settings.WelcomeBonusCoins = updateData.WelcomeBonusCoins;
            settings.CoinValidityDays = updateData.CoinValidityDays;
            settings.IsWelcomeBonusEnabled = updateData.IsWelcomeBonusEnabled;
            settings.IsActive = updateData.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Settings updated successfully" });
        }
    }
}

