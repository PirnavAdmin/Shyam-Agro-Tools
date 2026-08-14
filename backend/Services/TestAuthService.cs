using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.Repositories;
using ShyamAgroSuite.Api.Services.Interfaces;

namespace ShyamAgroSuite.Api.Services
{
    public class TestAuthService : ITestAuthService
    {
        private readonly ITestUserRepository _repository;
        private readonly IWebHostEnvironment _environment;
        private readonly IJwtService _jwtService;
        private readonly ApplicationDbContext _context;

        public TestAuthService(
            ITestUserRepository repository,
            IWebHostEnvironment environment,
            IJwtService jwtService,
            ApplicationDbContext context)
        {
            _repository = repository;
            _environment = environment;
            _jwtService = jwtService;
            _context = context;
        }

        // LOGIN / RESEND OTP
        public async Task<LoginResponse> LoginAsync(
            LoginRequest request)
        {
            var user = await _repository
                .GetByMobileAsync(request.MobileNumber);

            var random = new Random();
            string newOtp;
            do
            {
                newOtp = random.Next(1000, 9999).ToString();
            } while (user != null && !string.IsNullOrEmpty(user.OTP) && newOtp == user.OTP);

            if (user == null)
            {
                user = new TestUser
                {
                    MobileNumber = request.MobileNumber,
                    OTP = newOtp,
                    OTPGeneratedAt = DateTime.UtcNow,
                    CreatedDate = DateTime.UtcNow
                };

                await _repository.AddAsync(user);

                return new LoginResponse
                {
                    Success = true,
                    IsNewUser = true,
                    OTP = newOtp
                };
            }

            // Always update with a fresh unique OTP on login / resend
            user.OTP = newOtp;
            user.OTPGeneratedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(user);

            return new LoginResponse
            {
                Success = true,
                IsNewUser = string.IsNullOrEmpty(user.FullName),
                OTP = newOtp
            };
        }

        // SAVE PROFILE
        public async Task<bool> SaveNameAsync(
            SaveNameRequest request)
        {
            var user = await _repository
                .GetByMobileAsync(request.MobileNumber);

            if (user == null)
                return false;

            user.FullName = request.FullName;
            user.Email = request.Email;

            if (!string.IsNullOrEmpty(request.ProfileImageUrl))
            {
                user.ProfileImageUrl = request.ProfileImageUrl;
            }

            user.DoorNo = request.DoorNo;
            user.StreetArea = request.StreetArea;
            user.City = request.City;
            user.State = request.State;
            user.Pincode = request.Pincode;

            await _repository.UpdateAsync(user);

            // Synchronize name, email, and address to Customer profile
            if (!string.IsNullOrEmpty(request.MobileNumber))
            {
                var phoneDigits = new string(request.MobileNumber.Where(char.IsDigit).ToArray());
                if (phoneDigits.Length > 10)
                {
                    phoneDigits = phoneDigits.Substring(phoneDigits.Length - 10);
                }

                var customerList = await _context.Customers
                    .Select(c => new { c.Id, c.Phone, c.Email })
                    .ToListAsync();

                var matched = customerList.FirstOrDefault(c => 
                    (c.Phone != null && new string(c.Phone.Where(char.IsDigit).ToArray()).EndsWith(phoneDigits)) ||
                    (!string.IsNullOrEmpty(request.Email) && c.Email == request.Email));

                if (matched != null)
                {
                    var customer = await _context.Customers.FindAsync(matched.Id);
                    if (customer != null)
                    {
                        customer.Name = request.FullName ?? customer.Name;
                        customer.Email = request.Email ?? customer.Email;
                        
                        var parts = new List<string>();
                        if (!string.IsNullOrWhiteSpace(request.DoorNo)) parts.Add(request.DoorNo.Trim());
                        if (!string.IsNullOrWhiteSpace(request.StreetArea)) parts.Add(request.StreetArea.Trim());
                        if (!string.IsNullOrWhiteSpace(request.Pincode)) parts.Add(request.Pincode.Trim());
                        customer.Address = parts.Count > 0 ? string.Join(", ", parts) : customer.Address;
                        
                        customer.District = request.City ?? customer.District;
                        customer.State = request.State ?? customer.State;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return true;
        }

        // VERIFY OTP
        public async Task<VerifyOtpResponse> VerifyOtpAsync(
            VerifyOtpRequest request)
        {
            var user = await _repository
                .GetByMobileAsync(request.MobileNumber);

            if (user == null)
                throw new Exception("User not found");

            if (string.IsNullOrEmpty(user.OTP) || user.OTP != request.OTP)
                throw new Exception("Invalid or expired OTP");

            // Expire OTP after 10 minutes
            if (user.OTPGeneratedAt.HasValue && DateTime.UtcNow - user.OTPGeneratedAt.Value > TimeSpan.FromMinutes(10))
            {
                user.OTP = null;
                await _repository.UpdateAsync(user);
                throw new Exception("OTP has expired. Please request a new OTP.");
            }

            // Invalidate OTP immediately upon successful verification so it cannot be reused
            user.OTP = null;
            await _repository.UpdateAsync(user);

            // Generate JWT Token
            string token = _jwtService.GenerateTokenForTestUser(user);

            return new VerifyOtpResponse
            {
                Success = true,
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    MobileNumber = user.MobileNumber,
                    FullName = user.FullName,
                    Email = user.Email,

                    ProfileImageUrl = user.ProfileImageUrl,

                    DoorNo = user.DoorNo,
                    StreetArea = user.StreetArea,
                    City = user.City,
                    State = user.State,
                    Pincode = user.Pincode
                }
            };
        }

        // UPLOAD PROFILE IMAGE
        public async Task<string?> UploadProfileImageAsync(
            UploadProfileImageRequest request)
        {
            var user = await _repository
                .GetByMobileAsync(request.MobileNumber);

            if (user == null)
                return null;

            if (request.Image == null ||
                request.Image.Length == 0)
                return null;

            var webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot");
            }

            if (!Directory.Exists(webRootPath))
            {
                Directory.CreateDirectory(
                    webRootPath);
            }

            var uploadsFolder = Path.Combine(
                webRootPath,
                "uploads");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(
                    uploadsFolder);
            }

            var fileName =
                Guid.NewGuid().ToString() +
                Path.GetExtension(
                    request.Image.FileName);

            var filePath =
                Path.Combine(
                    uploadsFolder,
                    fileName);

            using (var stream =
                new FileStream(
                    filePath,
                    FileMode.Create))
            {
                await request.Image
                    .CopyToAsync(stream);
            }

            user.ProfileImageUrl =
                "/uploads/" + fileName;

            await _repository.UpdateAsync(user);

            return user.ProfileImageUrl;
        }

        // GET ALL USERS
        public async Task<List<TestUser>>
            GetAllUsersAsync()
        {
            return await _repository
                .GetAllAsync();
        }

        // GET USER
        public async Task<TestUser?>
            GetUserByMobileAsync(
                string mobileNumber)
        {
            return await _repository
                .GetByMobileAsync(
                    mobileNumber);
        }

        // UPDATE USER
        public async Task<bool> UpdateUserAsync(
            string mobileNumber,
            SaveNameRequest request)
        {
            var user = await _repository
                .GetByMobileAsync(
                    mobileNumber);

            if (user == null)
                return false;

            user.FullName = request.FullName;
            user.Email = request.Email;

            if (!string.IsNullOrEmpty(request.ProfileImageUrl))
            {
                user.ProfileImageUrl = request.ProfileImageUrl;
            }

            user.DoorNo = request.DoorNo;
            user.StreetArea = request.StreetArea;
            user.City = request.City;
            user.State = request.State;
            user.Pincode = request.Pincode;

            await _repository.UpdateAsync(user);

            // Synchronize name, email, and address to Customer profile
            if (!string.IsNullOrEmpty(mobileNumber))
            {
                var phoneDigits = new string(mobileNumber.Where(char.IsDigit).ToArray());
                if (phoneDigits.Length > 10)
                {
                    phoneDigits = phoneDigits.Substring(phoneDigits.Length - 10);
                }

                var customerList = await _context.Customers
                    .Select(c => new { c.Id, c.Phone, c.Email })
                    .ToListAsync();

                var matched = customerList.FirstOrDefault(c => 
                    (c.Phone != null && new string(c.Phone.Where(char.IsDigit).ToArray()).EndsWith(phoneDigits)) ||
                    (!string.IsNullOrEmpty(request.Email) && c.Email == request.Email));

                if (matched != null)
                {
                    var customer = await _context.Customers.FindAsync(matched.Id);
                    if (customer != null)
                    {
                        customer.Name = request.FullName ?? customer.Name;
                        customer.Email = request.Email ?? customer.Email;
                        
                        var parts = new List<string>();
                        if (!string.IsNullOrWhiteSpace(request.DoorNo)) parts.Add(request.DoorNo.Trim());
                        if (!string.IsNullOrWhiteSpace(request.StreetArea)) parts.Add(request.StreetArea.Trim());
                        if (!string.IsNullOrWhiteSpace(request.Pincode)) parts.Add(request.Pincode.Trim());
                        customer.Address = parts.Count > 0 ? string.Join(", ", parts) : customer.Address;
                        
                        customer.District = request.City ?? customer.District;
                        customer.State = request.State ?? customer.State;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return true;
        }

        // DELETE USER
        public async Task<bool> DeleteUserAsync(
            string mobileNumber)
        {
            var user = await _repository
                .GetByMobileAsync(
                    mobileNumber);

            if (user == null)
                return false;

            await _repository.DeleteAsync(
                user);

            return true;
        }
    }
}
