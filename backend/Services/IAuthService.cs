using ShyamAgroSuite.Api.DTOs;

namespace ShyamAgroSuite.Api.Services.Interfaces
{
    public interface IAuthService
    {
        Task<string> LoginAsync(LoginDto dto);

        Task<LoginResponseDto> VerifyOtpAsync(VerifyOtpDto dto);

        Task<bool> ResendOtpAsync(string email);

        Task<bool> ForgotPasswordAsync(string email);

        Task<bool> ResetPasswordAsync(ResetPasswordDto dto);

        Task<bool> CreateUserAsync(CreateUserDto dto);
    }
}