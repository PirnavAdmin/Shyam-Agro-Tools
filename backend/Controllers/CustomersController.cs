using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Customers?search=&status=
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetAll([FromQuery] string? search, [FromQuery] string? status)
        {
            var query = _context.Customers
                .Include(c => c.AgrarianProfile)
                .Include(c => c.Advisories)
                .Include(c => c.Orders)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.Name.Contains(search) || c.Phone.Contains(search) || c.Email.Contains(search));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            var customers = await query.OrderByDescending(c => c.Id).ToListAsync();
            return Ok(customers);
        }

        // GET: api/Customers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetById(int id)
        {
            var customer = await _context.Customers
                .Include(c => c.AgrarianProfile)
                .Include(c => c.Advisories)
                    .ThenInclude(a => a.Staff)
                .Include(c => c.Orders)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(new { Message = "Customer not found." });
            }

            return Ok(customer);
        }

        public static bool IsValidCustomerName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return false;
            var trimmed = name.Trim();
            if (trimmed.Length < 3 || trimmed.Length > 50) return false;
            if (!System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^[\p{L}\s.'\-]{3,50}$")) return false;
            
            var lettersOnly = new string(trimmed.Where(char.IsLetter).ToArray()).ToLower();
            if (lettersOnly.Distinct().Count() < 2) return false;

            // Must contain at least one vowel
            if (!lettersOnly.Any(c => "aeiouy".Contains(c))) return false;

            // Reject 3 or more consecutive repeating characters (e.g. Nnnnnn, vvvvvv)
            if (System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"(.)\1{2,}", System.Text.RegularExpressions.RegexOptions.IgnoreCase)) return false;

            // Reject random keyboard mashing (5+ consecutive consonants)
            if (System.Text.RegularExpressions.Regex.IsMatch(lettersOnly, @"[bcdfghjklmnpqrstvwxz]{5,}")) return false;

            return true;
        }

        public static bool IsValidPhone(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return false;
            var trimmed = phone.Trim().Replace(" ", "").Replace("-", "").Replace("+91", "");
            if (!System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^[6-9]\d{9}$")) return false;
            
            // Must have at least 3 distinct digits
            if (trimmed.Distinct().Count() < 3) return false;

            // Reject 5 or more consecutive repeating digits (e.g. 9888881234)
            if (System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"(\d)\1{4,}")) return false;

            // Reject repeating 2-digit pairs (e.g. 5454545454, 9898989898)
            if (System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"(\d{2})\1{3,}")) return false;

            string[] invalidPhones = new string[] {
                "1234567890", "0123456789", "9876543210", "1234567891", "6789012345",
                "9876543211", "9999999999", "8888888888", "7777777777", "6666666666",
                "5454545454", "9898989898", "9123456789", "6543210987", "0000000000"
            };
            if (invalidPhones.Contains(trimmed)) return false;

            return true;
        }

        private static bool IsValidAddress(string? address)
        {
            if (string.IsNullOrWhiteSpace(address)) return true; // optional
            var trimmed = address.Trim();
            if (trimmed.Length < 5 || trimmed.Length > 200) return false;
            if (!trimmed.Any(char.IsLetter)) return false;
            if (trimmed.Distinct().Count() < 3) return false;
            if (System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"(.)\1{3,}")) return false;
            if (trimmed.Length > 8 && !trimmed.Any(c => char.IsWhiteSpace(c) || c == ',' || c == '-' || c == '/' || c == '.')) return false;
            var lettersOnly = new string(trimmed.Where(char.IsLetter).ToArray());
            if (System.Text.RegularExpressions.Regex.IsMatch(lettersOnly, @"[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}")) return false;
            return true;
        }

        private static bool IsValidDistrictOrState(string? location)
        {
            if (string.IsNullOrWhiteSpace(location)) return true; // optional
            var trimmed = location.Trim();
            if (trimmed.Length < 2 || trimmed.Length > 50) return false;
            if (!System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^[\p{L}\s.'\-]{2,50}$")) return false;
            if (trimmed.Where(char.IsLetter).Select(char.ToLower).Distinct().Count() < 2) return false;
            return true;
        }

        // POST: api/Customers
        [HttpPost]
        public async Task<ActionResult<Customer>> Create([FromBody] Customer customer)
        {
            if (string.IsNullOrWhiteSpace(customer.Name) || !IsValidCustomerName(customer.Name))
            {
                return BadRequest(new { Message = "Invalid Customer Name. Must contain valid letters (3-50 characters), no dummy repeating characters like 'vvvvvv'." });
            }

            if (string.IsNullOrWhiteSpace(customer.Phone) || !IsValidPhone(customer.Phone))
            {
                return BadRequest(new { Message = "Invalid Phone Number. Must be a valid 10-digit mobile number starting with 6, 7, 8, or 9." });
            }

            if (!IsValidAddress(customer.Address))
            {
                return BadRequest(new { Message = "Invalid Address. Street address must be at least 5 characters long and cannot be random gibberish." });
            }

            if (!IsValidDistrictOrState(customer.District))
            {
                return BadRequest(new { Message = "Invalid District name." });
            }

            if (!IsValidDistrictOrState(customer.State))
            {
                return BadRequest(new { Message = "Invalid State name." });
            }

            // Check for existing duplicate customer by Phone
            var existingCustomer = await _context.Customers.FirstOrDefaultAsync(c => c.Phone == customer.Phone);
            if (existingCustomer != null)
            {
                return BadRequest(new { Message = $"A customer with phone number '{customer.Phone}' already exists in the directory (#{existingCustomer.Id} - {existingCustomer.Name}). Duplicate customer records are not allowed." });
            }

            // Register user if not already exists for this phone
            var user = await _context.GrowerUsers.FirstOrDefaultAsync(u => u.Phone == customer.Phone);
            if (user == null)
            {
                user = new GrowerUser
                {
                    Phone = customer.Phone,
                    Role = "Grower",
                    IsActive = true
                };
                _context.GrowerUsers.Add(user);
                await _context.SaveChangesAsync();
            }

            customer.UserId = user.Id;
            customer.JoinDate = DateTime.UtcNow;

            if (customer.AgrarianProfile != null)
            {
                customer.AgrarianProfile.Customer = customer;
            }

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Add notification
            var notification = new Notification
            {
                Title = "New Customer Registered",
                Message = $"Customer '{customer.Name}' ({customer.Phone}) has registered.",
                Type = "CustomerRegistered"
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
        }

        // PUT: api/Customers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Customer updateData)
        {
            if (string.IsNullOrWhiteSpace(updateData.Name) || !IsValidCustomerName(updateData.Name))
            {
                return BadRequest(new { Message = "Invalid Customer Name. Must contain valid letters (3-50 characters), no dummy repeating characters like 'vvvvvv'." });
            }

            if (string.IsNullOrWhiteSpace(updateData.Phone) || !IsValidPhone(updateData.Phone))
            {
                return BadRequest(new { Message = "Invalid Phone Number. Must be a valid 10-digit mobile number starting with 6, 7, 8, or 9." });
            }

            if (!IsValidAddress(updateData.Address))
            {
                return BadRequest(new { Message = "Invalid Address. Street address must be at least 5 characters long and cannot be random gibberish." });
            }

            if (!IsValidDistrictOrState(updateData.District))
            {
                return BadRequest(new { Message = "Invalid District name." });
            }

            if (!IsValidDistrictOrState(updateData.State))
            {
                return BadRequest(new { Message = "Invalid State name." });
            }

            var customer = await _context.Customers
                .Include(c => c.AgrarianProfile)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(new { Message = "Customer not found." });
            }

            customer.Name = updateData.Name;
            customer.Phone = updateData.Phone;
            customer.Email = (updateData.Email ?? string.Empty).Trim().ToLower();
            customer.Status = updateData.Status;
            customer.CoinsBalance = updateData.CoinsBalance;
            customer.Address = updateData.Address;
            customer.District = updateData.District;
            customer.State = updateData.State;

            if (!string.IsNullOrEmpty(updateData.ProfilePicture))
            {
                customer.ProfilePicture = updateData.ProfilePicture;
            }

            if (updateData.AgrarianProfile != null)
            {
                if (customer.AgrarianProfile == null)
                {
                    customer.AgrarianProfile = new CustomerAgrarian
                    {
                        CustomerId = id
                    };
                }

                customer.AgrarianProfile.SoilType = updateData.AgrarianProfile.SoilType;
                customer.AgrarianProfile.CropType = updateData.AgrarianProfile.CropType;
                customer.AgrarianProfile.FarmSizeAcres = updateData.AgrarianProfile.FarmSizeAcres;
                customer.AgrarianProfile.IrrigationSource = updateData.AgrarianProfile.IrrigationSource;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Customers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { Message = "Customer not found." });
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/Customers/5/advisory
        [HttpPost("{id}/advisory")]
        public async Task<ActionResult<CustomerAdvisory>> AddAdvisory(int id, [FromBody] AdvisoryLogRequest request)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { Message = "Customer not found." });
            }

            var staffExists = await _context.Staff.AnyAsync(s => s.Id == request.StaffId);
            if (!staffExists)
            {
                return BadRequest(new { Message = "Invalid Staff ID." });
            }

            var advisory = new CustomerAdvisory
            {
                CustomerId = id,
                AdvisoryText = request.AdvisoryText,
                Recommendation = request.Recommendation,
                StaffId = request.StaffId,
                DateCreated = DateTime.UtcNow
            };

            _context.CustomerAdvisories.Add(advisory);
            await _context.SaveChangesAsync();

            // Load staff navigation for response
            await _context.Entry(advisory).Reference(a => a.Staff).LoadAsync();

            return Ok(advisory);
        }
    }
}

