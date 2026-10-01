using System.Collections.Generic;

namespace ShyamAgroSuite.Api.Models.Config
{
    public class NotificationRoutingSettings
    {
        public Dictionary<string, string> SmsProviderRoutes { get; set; } = new();
        public string LoginOtpAppName { get; set; } = "ShyamAgro";
    }
}
