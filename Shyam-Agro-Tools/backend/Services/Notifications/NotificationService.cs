using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.Models.Config;
using ShyamAgroSuite.Api.Services.Notifications.Providers;

namespace ShyamAgroSuite.Api.Services.Notifications
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IEnumerable<ISmsProvider> _smsProviders;
        private readonly NotificationRoutingSettings _routingSettings;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            ApplicationDbContext context,
            IEnumerable<ISmsProvider> smsProviders,
            IOptions<NotificationRoutingSettings> routingSettings,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _smsProviders = smsProviders;
            _routingSettings = routingSettings.Value;
            _logger = logger;
        }

        public async Task<(bool IsSuccess, string? ProviderMessageId, string? ErrorMessage)> SendTemplateNotificationAsync(
            string eventType, string recipient, string var1, string var2)
        {
            // 1. Fetch active template from notification_templates database table
            var templateKey = eventType.ToUpperInvariant().Contains("LOGIN") ? "LOGIN_OTP" : eventType;
            var dbTemplate = await _context.NotificationTemplates
                .FirstOrDefaultAsync(t => t.TemplateKey == templateKey && t.Channel == "SMS" && t.IsActive);

            string bodyTemplate = dbTemplate?.Body ?? "Dear User, your OTP for login to ${var1} is ${var2} . This OTP is valid for 10 minutes. Do not share it with anyone - PITSOP";

            // 2. Render variables
            string renderedBody = bodyTemplate
                .Replace("${var1}", var1)
                .Replace("${var2}", var2);

            // 3. Resolve configured provider route
            string providerName = _routingSettings.SmsProviderRoutes.TryGetValue(eventType, out var routedProvider)
                ? routedProvider
                : "PointerIT";

            var provider = _smsProviders.FirstOrDefault(p => p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase))
                ?? _smsProviders.FirstOrDefault();

            if (provider == null)
            {
                _logger.LogError("No SMS Provider resolved for event {EventType}", eventType);
                return (false, null, "No SMS Provider configured.");
            }

            _logger.LogInformation("Sending SMS via provider {ProviderName} to {Recipient}", provider.ProviderName, recipient);
            var (isSuccess, providerMessageId, errorMessage) = await provider.SendAsync(recipient, renderedBody);

            // 4. Record entry in notification_logs table
            try
            {
                var logEntry = new NotificationLog
                {
                    EventType = eventType,
                    Recipient = recipient,
                    RenderedContent = renderedBody,
                    Status = isSuccess ? "Success" : "Failed",
                    ProviderMessageId = providerMessageId,
                    ErrorMessage = errorMessage,
                    CreatedAt = DateTime.UtcNow
                };

                _context.NotificationLogs.Add(logEntry);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log notification entry to database.");
            }

            return (isSuccess, providerMessageId, errorMessage);
        }
    }
}
