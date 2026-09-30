using System.Threading.Tasks;

namespace ShyamAgroSuite.Api.Services.Notifications.Providers
{
    public interface ISmsProvider
    {
        string ProviderName { get; }
        Task<(bool IsSuccess, string? ProviderMessageId, string? ErrorMessage)> SendAsync(
            string recipient, string content, string? subject = null);
    }
}
