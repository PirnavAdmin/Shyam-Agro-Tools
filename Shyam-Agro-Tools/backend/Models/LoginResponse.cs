namespace ShyamAgroSuite.Api.Models
{
    public class LoginResponse
    {
        public bool Success { get; set; }

        public bool IsNewUser { get; set; }

        public string OTP { get; set; } = string.Empty;
    }
}
