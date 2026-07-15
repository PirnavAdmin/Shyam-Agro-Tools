namespace ShyamAgroSuite.Api.Models
{
    public class VerifyOtpRequest
    {
        public string MobileNumber { get; set; } = string.Empty;

        public string OTP { get; set; } = string.Empty;
    }
}
