using System.Threading.Tasks;

namespace ShyamAgroSuite.Api.Services.Notifications
{
    public interface INotificationService
    {
        Task<(bool IsSuccess, string? ProviderMessageId, string? ErrorMessage)> SendTemplateNotificationAsync(
            string eventType, string recipient, string var1, string var2);
    }
}
