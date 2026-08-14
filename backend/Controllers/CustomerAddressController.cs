using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerAddressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomerAddressController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET ALL ADDRESSES
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _context.CustomerAddresses
                .OrderByDescending(x => x.AddressId)
                .ToListAsync();

            return Ok(data);
        }

        // GET ADDRESS BY ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var address = await _context.CustomerAddresses
                .FindAsync(id);

            if (address == null)
                return NotFound("Address not found.");

            return Ok(address);
        }

        private static bool IsValidName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return false;
            var trimmed = name.Trim();
            if (trimmed.Length < 2 || trimmed.Length > 50) return false;
            if (!System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^[\p{L}\s.'\-]{2,50}$")) return false;
            if (trimmed.Where(char.IsLetter).Select(char.ToLower).Distinct().Count() < 2) return false;
            if (System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"(.)\1{3,}")) return false;
            return true;
        }

        private static bool IsValidPhone(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return false;
            var trimmed = phone.Trim();
            if (!System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^[6-9]\d{9}$")) return false;
            if (trimmed.Distinct().Count() == 1) return false;
            string[] invalidPhones = new string[] {
                "1234567890", "0123456789", "9876543210", "1234567891",
                "6789012345", "9876543211", "9999999999", "8888888888", "7777777777", "6666666666"
            };
            if (invalidPhones.Contains(trimmed)) return false;
            return true;
        }

        private static bool IsValidAddress(string? address)
        {
            if (string.IsNullOrWhiteSpace(address)) return false;
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

        // SAVE ADDRESS
        [HttpPost]
        public async Task<IActionResult> SaveAddress(
            CustomerAddress address)
        {
            if (!string.IsNullOrWhiteSpace(address.FirstName) && !IsValidName(address.FirstName))
            {
                return BadRequest(new { Message = "Invalid First Name." });
            }
            if (!string.IsNullOrWhiteSpace(address.LastName) && !IsValidName(address.LastName))
            {
                return BadRequest(new { Message = "Invalid Last Name." });
            }
            if (!string.IsNullOrWhiteSpace(address.PhoneNumber) && !IsValidPhone(address.PhoneNumber))
            {
                return BadRequest(new { Message = "Invalid Phone Number. Must be a valid 10-digit mobile number." });
            }
            if (!string.IsNullOrWhiteSpace(address.FullAddress) && !IsValidAddress(address.FullAddress))
            {
                return BadRequest(new { Message = "Invalid Address. Street address must be at least 5 characters long and cannot be random gibberish." });
            }

            address.CreatedDate = DateTime.Now;

            _context.CustomerAddresses.Add(address);

            // Synchronize address details to Customer profile
            if (!string.IsNullOrEmpty(address.PhoneNumber))
            {
                var phoneDigits = new string(address.PhoneNumber.Where(char.IsDigit).ToArray());
                if (phoneDigits.Length > 10)
                {
                    phoneDigits = phoneDigits.Substring(phoneDigits.Length - 10);
                }

                var customer = await _context.Customers.FirstOrDefaultAsync(c => 
                    c.Phone.Replace(" ", "").Replace("-", "").Replace("+91", "").EndsWith(phoneDigits) ||
                    (!string.IsNullOrEmpty(address.Email) && c.Email == address.Email));

                if (customer != null)
                {
                    customer.Address = address.FullAddress;
                    customer.District = address.City;
                    customer.State = address.State;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Address saved successfully.",
                Data = address
            });
        }

        // UPDATE ADDRESS
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            CustomerAddress address)
        {
            if (!string.IsNullOrWhiteSpace(address.FirstName) && !IsValidName(address.FirstName))
            {
                return BadRequest(new { Message = "Invalid First Name." });
            }
            if (!string.IsNullOrWhiteSpace(address.LastName) && !IsValidName(address.LastName))
            {
                return BadRequest(new { Message = "Invalid Last Name." });
            }
            if (!string.IsNullOrWhiteSpace(address.PhoneNumber) && !IsValidPhone(address.PhoneNumber))
            {
                return BadRequest(new { Message = "Invalid Phone Number. Must be a valid 10-digit mobile number." });
            }
            if (!string.IsNullOrWhiteSpace(address.FullAddress) && !IsValidAddress(address.FullAddress))
            {
                return BadRequest(new { Message = "Invalid Address. Street address must be at least 5 characters long and cannot be random gibberish." });
            }

            var existing =
                await _context.CustomerAddresses.FindAsync(id);

            if (existing == null)
                return NotFound("Address not found.");

            existing.FirstName = address.FirstName;
            existing.LastName = address.LastName;
            existing.Email = address.Email;
            existing.PhoneNumber = address.PhoneNumber;
            existing.AlternatePhoneNumber =
                address.AlternatePhoneNumber;
            existing.FullAddress = address.FullAddress;
            existing.City = address.City;
            existing.State = address.State;
            existing.Pincode = address.Pincode;
            existing.AddressType = address.AddressType;

            // Synchronize address details to Customer profile
            if (!string.IsNullOrEmpty(address.PhoneNumber))
            {
                var phoneDigits = new string(address.PhoneNumber.Where(char.IsDigit).ToArray());
                if (phoneDigits.Length > 10)
                {
                    phoneDigits = phoneDigits.Substring(phoneDigits.Length - 10);
                }

                var customer = await _context.Customers.FirstOrDefaultAsync(c => 
                    c.Phone.Replace(" ", "").Replace("-", "").Replace("+91", "").EndsWith(phoneDigits) ||
                    (!string.IsNullOrEmpty(address.Email) && c.Email == address.Email));

                if (customer != null)
                {
                    customer.Address = address.FullAddress;
                    customer.District = address.City;
                    customer.State = address.State;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        // DELETE ADDRESS
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var address =
                await _context.CustomerAddresses.FindAsync(id);

            if (address == null)
                return NotFound("Address not found.");

            _context.CustomerAddresses.Remove(address);

            await _context.SaveChangesAsync();

            return Ok("Address deleted successfully.");
        }
    }
}