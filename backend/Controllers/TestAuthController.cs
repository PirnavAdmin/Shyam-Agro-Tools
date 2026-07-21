using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.Services;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("test-auth")]
    [AllowAnonymous]
    public class TestAuthController : ControllerBase
    {
        private readonly ITestAuthService _service;

        public TestAuthController(
            ITestAuthService service)
        {
            _service = service;
        }

        // LOGIN
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(
            LoginRequest request)
        {
            var result =
                await _service.LoginAsync(request);

            return Ok(result);
        }

        // SAVE PROFILE
        [HttpPost("save-name")]
        [AllowAnonymous]
        public async Task<IActionResult> SaveName(
            SaveNameRequest request)
        {
            var result =
                await _service.SaveNameAsync(request);

            return Ok(new
            {
                success = result
            });
        }

        // VERIFY OTP
        [HttpPost("verify-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyOtp(
            VerifyOtpRequest request)
        {
            var result =
                await _service.VerifyOtpAsync(request);

            return Ok(result);
        }

        // UPLOAD PROFILE IMAGE
        [HttpPost("upload-profile-image")]
        [AllowAnonymous]
        public async Task<IActionResult> UploadProfileImage(
            [FromForm] UploadProfileImageRequest request)
        {
            var imageUrl =
                await _service.UploadProfileImageAsync(
                    request);

            if (imageUrl == null)
                return NotFound();

            return Ok(new
            {
                success = true,
                imageUrl
            });
        }

        // GET ALL USERS
        [HttpGet("users")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllUsers()
        {
            var users =
                await _service.GetAllUsersAsync();

            return Ok(users);
        }

        // GET USER
        [HttpGet("user/{mobileNumber}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUser(
            string mobileNumber)
        {
            var user =
                await _service.GetUserByMobileAsync(
                    mobileNumber);

            if (user == null)
                return NotFound();

            return Ok(user);
        }

        // UPDATE USER
        [HttpPut("user/{mobileNumber}")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateUser(
            string mobileNumber,
            SaveNameRequest request)
        {
            var result =
                await _service.UpdateUserAsync(
                    mobileNumber,
                    request);

            if (!result)
                return NotFound();

            return Ok(new
            {
                success = true
            });
        }

        // DELETE USER
        [HttpDelete("user/{mobileNumber}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteUser(
            string mobileNumber)
        {
            var result =
                await _service.DeleteUserAsync(
                    mobileNumber);

            if (!result)
                return NotFound();

            return Ok(new
            {
                success = true
            });
        }
    }
}
