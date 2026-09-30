using System;

namespace ShyamAgroSuite.Api.Models
{
    public class CoinsSettings
    {
        public int Id { get; set; }
        public decimal ConversionRate { get; set; } = 1.0m; // e.g. 1 coin = 1 Rupee
        public decimal EarnRate { get; set; } = 0.05m;      // coins earned per Rupee spent (e.g. 5%)
        public int MinRedeemableCoins { get; set; } = 100;
        public int MaxRedeemableCoins { get; set; } = 5000;

        public int RupeesRequiredForOneCoin { get; set; } = 20;
        public decimal MinimumOrderValue { get; set; } = 100.00m;
        public decimal MaxCartRedeemPercent { get; set; } = 20.00m;
        public int WelcomeBonusCoins { get; set; } = 25;
        public int CoinValidityDays { get; set; } = 180;
        public bool IsWelcomeBonusEnabled { get; set; } = true;
        public bool IsActive { get; set; } = true;
    }
}
