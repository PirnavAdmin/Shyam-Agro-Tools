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

            var customers = await query.ToListAsync();
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

        // POST: api/Customers
        [HttpPost]
        public async Task<ActionResult<Customer>> Create([FromBody] Customer customer)
        {
            if (string.IsNullOrEmpty(customer.Name) || string.IsNullOrEmpty(customer.Phone))
            {
                return BadRequest(new { Message = "Name and Phone number are required." });
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

            return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
        }

        // PUT: api/Customers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Customer updateData)
        {
            var customer = await _context.Customers
                .Include(c => c.AgrarianProfile)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(new { Message = "Customer not found." });
            }

            customer.Name = updateData.Name;
            customer.Phone = updateData.Phone;
            customer.Email = updateData.Email;
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

