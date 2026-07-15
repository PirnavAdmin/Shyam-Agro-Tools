using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminProfileController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Resolves the logged-in admin email from JWT claims or custom headers, fallback to main seed
        private string GetLoggedInAdminEmail()
        {
            if (User?.Identity?.IsAuthenticated == true && !string.IsNullOrEmpty(User.Identity.Name))
            {
                return User.Identity.Name;
            }

            var keys = new[] { "email", "useremail", "user-email", "x-email", "x-user-email" };
            foreach (var key in keys)
            {
                var headerVal = Request.Headers.FirstOrDefault(h => h.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                if (!string.IsNullOrEmpty(headerVal))
                {
                    return headerVal.ToString();
                }
            }

            var queryKeys = new[] { "email", "useremail" };
            foreach (var key in queryKeys)
            {
                var queryVal = Request.Query.FirstOrDefault(q => q.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                if (!string.IsNullOrEmpty(queryVal))
                {
                    return queryVal.ToString();
                }
            }

            // Default fallback admin email
            return "charanbhaskar4455@gmail.com";
        }

        // GET: api/AdminProfile
        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var adminEmail = GetLoggedInAdminEmail();
            var admin = await _context.Set<User>().FirstOrDefaultAsync(u => u.Email.ToLower() == adminEmail.ToLower());

            if (admin == null)
            {
                // Try searching for any active admin in database if fallback fails
                admin = await _context.Set<User>().FirstOrDefaultAsync();
            }

            if (admin == null)
            {
                return NotFound(new { success = false, message = "Admin profile not found." });
            }

            string username = admin.Email.Contains("@") ? admin.Email.Split('@')[0] : admin.Email;
            string roleLabel = admin.Role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ? "SUPER ADMINISTRATOR" : "ADMINISTRATOR";
            string systemAccess = admin.Role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) 
                ? "Full System Access Granted (All Screens)" 
                : "Standard System Access (Limited Screens)";

            return Ok(new
            {
                success = true,
                profile = new
                {
                    username = username,
                    fullName = admin.FullName ?? username,
                    email = admin.Email,
                    mobileNumber = admin.MobileNumber ?? "+91 9876543210",
                    employeeId = admin.EmployeeId ?? "#SA001",
                    role = admin.Role,
                    roleLabel = roleLabel,
                    isActive = admin.IsActive,
                    systemAccess = systemAccess,
                    createdDate = admin.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss")
                }
            });
        }

        // PUT: api/AdminProfile
        // PUT: api/AdminProfile/settings
        // POST: api/AdminProfile/settings
        // POST: api/AdminProfile
        [HttpPut]
        [HttpPut("settings")]
        [HttpPost("settings")]
        [HttpPost]
        public async Task<IActionResult> UpdateProfile([FromBody] AdminProfileUpdateRequest request)
        {
            var adminEmail = GetLoggedInAdminEmail();
            var admin = await _context.Set<User>().FirstOrDefaultAsync(u => u.Email.ToLower() == adminEmail.ToLower());

            if (admin == null)
            {
                admin = await _context.Set<User>().FirstOrDefaultAsync();
            }

            if (admin == null)
            {
                return NotFound(new { success = false, message = "Admin profile not found." });
            }

            // If changing password
            if (!string.IsNullOrEmpty(request.NewPassword))
            {
                if (request.NewPassword != request.ConfirmNewPassword)
                {
                    return BadRequest(new { success = false, message = "Passwords do not match." });
                }
                admin.Password = request.NewPassword;
            }

            admin.FullName = request.FullName ?? admin.FullName;
            admin.MobileNumber = request.MobileNumber ?? admin.MobileNumber;
            admin.EmployeeId = request.EmployeeId ?? admin.EmployeeId;

            await _context.SaveChangesAsync();

            string username = admin.Email.Contains("@") ? admin.Email.Split('@')[0] : admin.Email;
            string roleLabel = admin.Role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ? "SUPER ADMINISTRATOR" : "ADMINISTRATOR";
            string systemAccess = admin.Role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) 
                ? "Full System Access Granted (All Screens)" 
                : "Standard System Access (Limited Screens)";

            return Ok(new
            {
                success = true,
                message = "Admin profile updated successfully.",
                profile = new
                {
                    username = username,
                    fullName = admin.FullName,
                    email = admin.Email,
                    mobileNumber = admin.MobileNumber,
                    employeeId = admin.EmployeeId,
                    role = admin.Role,
                    roleLabel = roleLabel,
                    isActive = admin.IsActive,
                    systemAccess = systemAccess,
                    createdDate = admin.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss")
                }
            });
        }

        public class AdminProfileUpdateRequest
        {
            public string? FullName { get; set; }
            public string? MobileNumber { get; set; }
            public string? EmployeeId { get; set; }
            public string? NewPassword { get; set; }
            public string? ConfirmNewPassword { get; set; }
        }
    }
}
