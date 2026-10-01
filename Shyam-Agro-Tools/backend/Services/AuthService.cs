using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.DTOs;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.Services.Interfaces;

namespace ShyamAgroSuite.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;

        public AuthService(
            ApplicationDbContext context,
            IJwtService jwtService,
            IEmailService emailService)
        {
            _context = context;
            _jwtService = jwtService;
            _emailService = emailService;
        }

        // LOGIN
        public async Task<string> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (user == null)
                return "Invalid Email";

            if (user.Password != dto.Password)
                return "Invalid Password";

            var otp = new Random()
                .Next(100000, 999999)
                .ToString();

            user.Otp = otp;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            await _emailService.SendOtpEmailAsync(
                user.Email, otp);

            return "OTP Sent Successfully";
        }

        // VERIFY OTP
        public async Task<LoginResponseDto> VerifyOtpAsync(
            VerifyOtpDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (user == null)
                return null;

            if (user.Otp != dto.Otp)
                return null;

            user.Otp = null;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            var token = _jwtService.GenerateToken(user);

            return new LoginResponseDto
            {
                Email = user.Email,
                Role = user.Role,
                Token = token,
                Message = "Login Successful"
            };
        }

        // RESEND OTP
        public async Task<bool> ResendOtpAsync(string email)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == email);

            if (user == null)
                return false;

            var otp = new Random()
                .Next(100000, 999999)
                .ToString();

            user.Otp = otp;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            await _emailService.SendOtpEmailAsync(
                user.Email, otp);

            return true;
        }

        // FORGOT PASSWORD
        public async Task<bool> ForgotPasswordAsync(string email)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == email);

            if (user == null)
                return false;

            var otp = new Random()
                .Next(100000, 999999)
                .ToString();

            user.Otp = otp;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            await _emailService.SendOtpEmailAsync(
                user.Email, otp);

            return true;
        }

        // RESET PASSWORD
        public async Task<bool> ResetPasswordAsync(
            ResetPasswordDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (user == null)
                return false;

            if (user.Otp != dto.Otp)
                return false;

            user.Password = dto.NewPassword;
            user.Otp = null;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return true;
        }

        // CREATE USER
        public async Task<bool> CreateUserAsync(
            CreateUserDto dto)
        {
            var existingUser = await _context.Users
                .AnyAsync(x => x.Email == dto.Email);

            if (existingUser)
                return false;

            var user = new User
            {
                Email = dto.Email,
                Password = dto.Password,
                Role = dto.Role,
                IsActive = true,
                CreatedDate = DateTime.Now
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}