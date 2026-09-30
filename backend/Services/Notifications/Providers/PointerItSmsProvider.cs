using System;
using System.Net.Http;
using System.Text.Json;
using System.Web;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShyamAgroSuite.Api.Models.Config;

namespace ShyamAgroSuite.Api.Services.Notifications.Providers
{
    public class PointerItSmsProvider : ISmsProvider
    {
        public string ProviderName => "PointerIT";
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<PointerItSmsProvider> _logger;
        private readonly PointerItSmsSettings _settings;

        public PointerItSmsProvider(
            IHttpClientFactory httpClientFactory,
            ILogger<PointerItSmsProvider> logger,
            IOptions<PointerItSmsSettings> options)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _settings = options.Value;
        }

        public async Task<(bool IsSuccess, string? ProviderMessageId, string? ErrorMessage)> SendAsync(
            string recipient, string content, string? subject = null)
        {
            try
            {
                var client = _httpClientFactory.CreateClient(nameof(PointerItSmsProvider));
                string baseUrl = _settings.Url.EndsWith("?username=")
                    ? _settings.Url.Substring(0, _settings.Url.Length - 10)
                    : _settings.Url;

                var builder = new UriBuilder(baseUrl);
                var query = HttpUtility.ParseQueryString(builder.Query);

                query["username"] = _settings.Username;
                query["password"] = _settings.Password;
                query["unicode"] = "false";
                query["from"] = _settings.SenderId;

                // Format phone number (remove '+' prefix and leading country code if needed)
                string formattedRecipient = recipient.Trim();
                if (formattedRecipient.StartsWith("+"))
                {
                    formattedRecipient = formattedRecipient.Substring(1);
                }

                query["to"] = formattedRecipient;
                query["dltPrincipalEntityId"] = _settings.PrincipalEntityId;
                query["dltContentId"] = _settings.ContentId;
                query["text"] = content;

                builder.Query = query.ToString();
                var requestUrl = builder.ToString();

                var response = await client.PostAsync(requestUrl, null);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("PointerIT HTTP Failure: {StatusCode}, Response: {ResponseContent}", response.StatusCode, responseContent);
                    return (false, null, $"HTTP {response.StatusCode}");
                }

                using var doc = JsonDocument.Parse(responseContent);
                var root = doc.RootElement;

                int statusCode = root.TryGetProperty("statusCode", out var statusEl) && statusEl.ValueKind == JsonValueKind.Number ? statusEl.GetInt32() : 0;
                string state = root.TryGetProperty("state", out var stateEl) ? stateEl.GetString() ?? "" : "";
                string description = root.TryGetProperty("description", out var descEl) ? descEl.GetString() ?? "" : "";
                string txId = root.TryGetProperty("transactionId", out var txEl) ? txEl.GetRawText() : "";

                if (statusCode == 200 && state == "SUBMIT_ACCEPTED")
                {
                    _logger.LogInformation("PointerIT SMS sent successfully to {Recipient}. TxId: {TxId}", recipient, txId);
                    return (true, txId, null);
                }

                _logger.LogWarning("PointerIT SMS submission rejected for {Recipient}. Status: {StatusCode}, State: {State}, Description: {Description}", recipient, statusCode, state, description);
                return (false, null, string.IsNullOrWhiteSpace(description) ? state : description);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PointerIT SMS transmission failed for recipient {Recipient}", recipient);
                return (false, null, ex.Message);
            }
        }
    }
}
