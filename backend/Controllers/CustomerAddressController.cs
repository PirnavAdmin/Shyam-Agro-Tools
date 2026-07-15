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

        // SAVE ADDRESS
        [HttpPost]
        public async Task<IActionResult> SaveAddress(
            CustomerAddress address)
        {
            address.CreatedDate = DateTime.Now;

            _context.CustomerAddresses.Add(address);

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