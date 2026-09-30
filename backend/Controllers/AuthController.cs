using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShyamAgroSuite.Api.DTOs;
using ShyamAgroSuite.Api.Repositories;
using ShyamAgroSuite.Api.Services.Interfaces;
using ShyamAgroSuite.Api.Services.Notifications;

namespace ShyamAgroSuite.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IOtpService _otpService;
        private readonly IJwtService _jwtService;
        private readonly ITestUserRepository _userRepository;

        public AuthController(
            IAuthService authService,
            IOtpService otpService,
            IJwtService jwtService,
            ITestUserRepository userRepository)
        {
            _authService = authService;
            _otpService = otpService;
            _jwtService = jwtService;
            _userRepository = userRepository;
        }

        public class SendLoginOtpRequest
        {
            public string? PhoneNumber { get; set; }
            public string? MobileNumber { get; set; }

            public string GetPhone() => (!string.IsNullOrWhiteSpace(PhoneNumber) ? PhoneNumber : MobileNumber) ?? string.Empty;
        }

        public class VerifyLoginOtpRequest
        {
            public string? PhoneNumber { get; set; }
            public string? MobileNumber { get; set; }
            public string Otp { get; set; } = string.Empty;

            public string GetPhone() => (!string.IsNullOrWhiteSpace(PhoneNumber) ? PhoneNumber : MobileNumber) ?? string.Empty;
        }

        // Send SMS OTP via PointerIT
        [HttpPost("send-login-otp")]
        public async Task<IActionResult> SendLoginOtp([FromBody] SendLoginOtpRequest request)
        {
            string phone = request?.GetPhone().Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(phone))
            {
                return BadRequest(new { success = false, message = "PhoneNumber or MobileNumber is required." });
            }

            // Ensure TestUser record exists for this mobile number
            var existingUser = await _userRepository.GetByMobileAsync(phone);
            if (existingUser == null)
            {
                existingUser = new Models.TestUser
                {
                    MobileNumber = phone,
                    CreatedDate = DateTime.UtcNow
                };
                await _userRepository.AddAsync(existingUser);
            }

            var (isSent, challengeId, errorMessage) = await _otpService.GenerateAndSendOtpAsync(
                recipient: phone,
                channel: "SMS",
                purpose: "Login",
                userId: existingUser.Id
            );

            if (!isSent)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Unable to send login OTP via PointerIT SMS.",
                    error = errorMessage
                });
            }

            bool isNewUser = string.IsNullOrWhiteSpace(existingUser.FullName);

            return Ok(new
            {
                success = true,
                message = "Login OTP sent successfully via PointerIT SMS.",
                challengeId,
                isNewUser
            });
        }

        // Verify SMS OTP & Generate JWT Authentication Token
        [HttpPost("verify-login-otp")]
        public async Task<IActionResult> VerifyLoginOtp([FromBody] VerifyLoginOtpRequest request)
        {
            string phone = request?.GetPhone().Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(request?.Otp))
            {
                return BadRequest(new { success = false, message = "PhoneNumber and Otp are required." });
            }

            var (isValid, message) = await _otpService.VerifyOtpAsync(
                recipient: phone,
                purpose: "Login",
                otpCode: request.Otp.Trim()
            );

            if (!isValid)
            {
                return BadRequest(new { success = false, message });
            }

            // Fetch or create user record
            var user = await _userRepository.GetByMobileAsync(phone);
            if (user == null)
            {
                user = new Models.TestUser
                {
                    MobileNumber = phone,
                    CreatedDate = DateTime.UtcNow
                };
                await _userRepository.AddAsync(user);
            }

            // Generate JWT Bearer Token
            string token = _jwtService.GenerateTokenForTestUser(user);

            return Ok(new
            {
                success = true,
                message = "OTP verified successfully.",
                token,
                user = new
                {
                    id = user.Id,
                    mobileNumber = user.MobileNumber,
                    fullName = user.FullName,
                    email = user.Email
                }
            });
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