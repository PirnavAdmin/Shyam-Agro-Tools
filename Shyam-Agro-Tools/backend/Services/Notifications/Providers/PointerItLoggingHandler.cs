using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace ShyamAgroSuite.Api.Services.Notifications.Providers
{
    public class PointerItLoggingHandler : DelegatingHandler
    {
        private readonly ILogger<PointerItLoggingHandler> _logger;

        public PointerItLoggingHandler(ILogger<PointerItLoggingHandler> logger)
        {
            _logger = logger;
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Sending PointerIT SMS HTTP request to {RequestUri}", request.RequestUri);
            var response = await base.SendAsync(request, cancellationToken);
            _logger.LogInformation("PointerIT SMS HTTP response status {StatusCode}", response.StatusCode);
            return response;
        }
    }
}
