namespace ShyamAgroSuite.Api.Models
{
    public class VerifyOtpResponse
    {
        public bool Success { get; set; }

        public UserDto User { get; set; } = new();

        public string? Token { get; set; }
    }
}
