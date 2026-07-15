using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StaffController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Staff>>> GetAll()
        {
            return await _context.Staff.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Staff>> GetById(int id)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null)
            {
                return NotFound(new { Message = "Staff member not found." });
            }
            return Ok(staff);
        }

        [HttpPost]
        public async Task<ActionResult<Staff>> Create([FromBody] Staff staff)
        {
            if (string.IsNullOrEmpty(staff.Name))
            {
                return BadRequest(new { Message = "Staff Name is required." });
            }

            _context.Staff.Add(staff);

            // Add notification
            var notification = new Notification
            {
                Title = "Staff Added",
                Message = $"{staff.Name} has been registered as {staff.Role}.",
                Type = "StaffAdded"
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = staff.Id }, staff);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Staff updateData)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null)
            {
                return NotFound(new { Message = "Staff member not found." });
            }

            staff.Name = updateData.Name;
            staff.Email = updateData.Email;
            staff.Phone = updateData.Phone;
            staff.Role = updateData.Role;
            staff.Status = updateData.Status;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null)
            {
                return NotFound(new { Message = "Staff member not found." });
            }

            _context.Staff.Remove(staff);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

