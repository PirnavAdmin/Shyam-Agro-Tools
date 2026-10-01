using System.Threading.Tasks;

namespace ShyamAgroSuite.Api.Services.Notifications
{
    public interface IOtpService
    {
        Task<(bool IsSent, string ChallengeId, string? ErrorMessage)> GenerateAndSendOtpAsync(
            string recipient, string channel = "SMS", string purpose = "Login", int? userId = null, string? overrideOtpCode = null);

        Task<(bool IsValid, string Message)> VerifyOtpAsync(
            string recipient, string purpose, string otpCode);
    }
}
