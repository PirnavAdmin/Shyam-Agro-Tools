using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
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

        public TestAuthService(
            ITestUserRepository repository,
            IWebHostEnvironment environment,
            IJwtService jwtService)
        {
            _repository = repository;
            _environment = environment;
            _jwtService = jwtService;
        }

        // LOGIN
        public async Task<LoginResponse> LoginAsync(
            LoginRequest request)
        {
            var user = await _repository
                .GetByMobileAsync(request.MobileNumber);

            if (user == null)
            {
                var random = new Random();
                string otp = random.Next(1000, 9999).ToString();

                user = new TestUser
                {
                    MobileNumber = request.MobileNumber,
                    OTP = otp,
                    OTPGeneratedAt = DateTime.UtcNow,
                    CreatedDate = DateTime.UtcNow
                };

                await _repository.AddAsync(user);

                return new LoginResponse
                {
                    Success = true,
                    IsNewUser = true,
                    OTP = otp
                };
            }

            if (string.IsNullOrEmpty(user.OTP))
            {
                var random = new Random();
                string otp = random.Next(1000, 9999).ToString();

                user.OTP = otp;
                user.OTPGeneratedAt = DateTime.UtcNow;

                await _repository.UpdateAsync(user);
            }

            return new LoginResponse
            {
                Success = true,
                IsNewUser = string.IsNullOrEmpty(user.FullName),
                OTP = user.OTP!
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

            user.ProfileImageUrl = request.ProfileImageUrl;

            user.DoorNo = request.DoorNo;
            user.StreetArea = request.StreetArea;
            user.City = request.City;
            user.State = request.State;
            user.Pincode = request.Pincode;

            await _repository.UpdateAsync(user);

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

            if (user.OTP != request.OTP)
                throw new Exception("Invalid OTP");

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

            var uploadsFolder = Path.Combine(
                _environment.WebRootPath,
                "profile-images");

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
                "/profile-images/" + fileName;

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

            user.ProfileImageUrl =
                request.ProfileImageUrl;

            user.DoorNo = request.DoorNo;
            user.StreetArea =
                request.StreetArea;
            user.City = request.City;
            user.State = request.State;
            user.Pincode = request.Pincode;

            await _repository.UpdateAsync(user);

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
