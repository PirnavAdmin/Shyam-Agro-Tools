using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Services
{
    public interface ITestAuthService
    {
        Task<LoginResponse> LoginAsync(
            LoginRequest request);

        Task<bool> SaveNameAsync(
            SaveNameRequest request);

        Task<VerifyOtpResponse> VerifyOtpAsync(
            VerifyOtpRequest request);

        Task<string?> UploadProfileImageAsync(
            UploadProfileImageRequest request);

        Task<List<TestUser>> GetAllUsersAsync();

        Task<TestUser?> GetUserByMobileAsync(
            string mobileNumber);

        Task<bool> UpdateUserAsync(
            string mobileNumber,
            SaveNameRequest request);

        Task<bool> DeleteUserAsync(
            string mobileNumber);
    }
}
