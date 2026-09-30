using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.Models.Config;

namespace ShyamAgroSuite.Api.Services.Notifications
{
    public class OtpService : IOtpService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly NotificationRoutingSettings _routingSettings;
        private readonly ILogger<OtpService> _logger;

        public OtpService(
            ApplicationDbContext context,
            INotificationService notificationService,
            IOptions<NotificationRoutingSettings> routingSettings,
            ILogger<OtpService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _routingSettings = routingSettings.Value;
            _logger = logger;
        }

        public async Task<(bool IsSent, string ChallengeId, string? ErrorMessage)> GenerateAndSendOtpAsync(
            string recipient, string channel = "SMS", string purpose = "Login", int? userId = null, string? overrideOtpCode = null)
        {
            string normalizedRecipient = recipient.Trim();

            // 1. Invalidate previous unused OTPs for this recipient & purpose
            var existingOtps = await _context.Otps
                .Where(o => o.Recipient == normalizedRecipient && o.Purpose == purpose && !o.IsUsed)
                .ToListAsync();

            foreach (var existing in existingOtps)
            {
                existing.IsUsed = true;
            }

            // 2. Generate or use provided 6-digit random code
            string otpCode = !string.IsNullOrWhiteSpace(overrideOtpCode)
                ? overrideOtpCode.Trim()
                : RandomNumberGenerator.GetInt32(100000, 999999).ToString();
            string challengeId = Guid.NewGuid().ToString("N");
            string codeHash = ComputeSha256Hash(otpCode);

            // 3. Save hashed OTP to database (10 minutes expiry)
            var otpRecord = new OtpRecord
            {
                Recipient = normalizedRecipient,
                Purpose = purpose,
                CodeHash = codeHash,
                Expiry = DateTime.UtcNow.AddMinutes(10),
                IsUsed = false,
                ChallengeId = challengeId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Otps.Add(otpRecord);
            await _context.SaveChangesAsync();

            // 4. Dispatch SMS notification
            string appName = _routingSettings.LoginOtpAppName ?? "ShyamAgro";
            var (isSent, _, errorMessage) = await _notificationService.SendTemplateNotificationAsync(
                eventType: purpose,
                recipient: normalizedRecipient,
                var1: appName,
                var2: otpCode
            );

            if (!isSent)
            {
                _logger.LogError("Failed to send OTP to {Recipient}: {ErrorMessage}", normalizedRecipient, errorMessage);
            }

            return (isSent, challengeId, errorMessage);
        }

        public async Task<(bool IsValid, string Message)> VerifyOtpAsync(
            string recipient, string purpose, string otpCode)
        {
            if (string.IsNullOrWhiteSpace(recipient) || string.IsNullOrWhiteSpace(otpCode))
            {
                return (false, "Recipient and OTP code are required.");
            }

            string normalizedRecipient = recipient.Trim();
            string inputHash = ComputeSha256Hash(otpCode.Trim());

            var activeOtp = await _context.Otps
                .Where(o => o.Recipient == normalizedRecipient && o.Purpose == purpose && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (activeOtp == null)
            {
                return (false, "Invalid or expired OTP.");
            }

            if (activeOtp.Expiry < DateTime.UtcNow)
            {
                activeOtp.IsUsed = true;
                await _context.SaveChangesAsync();
                return (false, "OTP has expired. Please request a new code.");
            }

            if (!string.Equals(activeOtp.CodeHash, inputHash, StringComparison.OrdinalIgnoreCase))
            {
                return (false, "Invalid OTP code.");
            }

            // Mark OTP as used
            activeOtp.IsUsed = true;
            await _context.SaveChangesAsync();

            return (true, "OTP verified successfully.");
        }

        private static string ComputeSha256Hash(string rawData)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
            var builder = new StringBuilder();
            foreach (var b in bytes)
            {
                builder.Append(b.ToString("x2"));
            }
            return builder.ToString();
        }
    }
}
