namespace ShyamAgroSuite.Api.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendOtpEmailAsync(string email, string otp);
    }
}