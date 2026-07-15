using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShyamAgroSuite.Api.DTOs;
using ShyamAgroSuite.Api.Services.Interfaces;

namespace ShyamAgroSuite.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // Login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (result.Contains("Invalid"))
            {
                return BadRequest(new
                {
                    Message = result
                });
            }

            return Ok(new
            {
                Message = result
            });
        }

        // Verify OTP
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp(
            VerifyOtpDto dto)
        {
            var result =
                await _authService.VerifyOtpAsync(dto);

            if (result == null)
            {
                return BadRequest(new
                {
                    Message = "Invalid or Expired OTP"
                });
            }

            return Ok(result);
        }

        // Resend OTP
        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp(
            ResendOtpDto dto)
        {
            var result =
                await _authService.ResendOtpAsync(dto.Email);

            if (!result)
            {
                return BadRequest(new
                {
                    Message = "Unable to send OTP"
                });
            }

            return Ok(new
            {
                Message = "OTP Sent Successfully"
            });
        }

        // Forgot Password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(
            ForgotPasswordDto dto)
        {
            var result =
                await _authService
                    .ForgotPasswordAsync(dto.Email);

            if (!result)
            {
                return BadRequest(new
                {
                    Message = "User Not Found"
                });
            }

            return Ok(new
            {
                Message = "Reset OTP Sent Successfully"
            });
        }

        // Reset Password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(
            ResetPasswordDto dto)
        {
            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return BadRequest(new
                {
                    Message = "Passwords do not match"
                });
            }

            var result =
                await _authService
                    .ResetPasswordAsync(dto);

            if (!result)
            {
                return BadRequest(new
                {
                    Message = "Invalid OTP"
                });
            }

            return Ok(new
            {
                Message = "Password Reset Successfully"
            });
        }

        // Create User (SuperAdmin only)
        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser(
            CreateUserDto dto)
        {
            if (dto.Password != dto.ConfirmPassword)
            {
                return BadRequest(new
                {
                    Message = "Passwords do not match"
                });
            }

            var result =
                await _authService.CreateUserAsync(dto);

            if (!result)
            {
                return BadRequest(new
                {
                    Message = "User already exists"
                });
            }

            return Ok(new
            {
                Message = "User Created Successfully"
            });
        }
    }
}