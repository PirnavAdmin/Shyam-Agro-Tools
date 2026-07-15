using System;
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
    public class SuppliersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SuppliersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Supplier>>> GetAll()
        {
            return await _context.Suppliers.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Supplier>> GetById(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return NotFound(new { Message = "Supplier not found." });
            }
            return Ok(supplier);
        }

        [HttpPost]
        public async Task<ActionResult<Supplier>> Create([FromBody] Supplier supplier)
        {
            if (string.IsNullOrEmpty(supplier.Name))
            {
                return BadRequest(new { Message = "Supplier Name is required." });
            }

            _context.Suppliers.Add(supplier);

            // Add notification
            var notification = new Notification
            {
                Title = "New Supplier added",
                Message = $"Supplier '{supplier.Name}' added by administrator.",
                Type = "NewSupplier",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
        }

        public class SellerRegistrationRequest
        {
            public string FullName { get; set; } = string.Empty;
            public string BusinessName { get; set; } = string.Empty;
            public string ProductCategory { get; set; } = string.Empty;
            public string MobileNumber { get; set; } = string.Empty;
            public string EmailAddress { get; set; } = string.Empty;
            public string GstinNumber { get; set; } = string.Empty;
            public string BusinessAddress { get; set; } = string.Empty;
        }

        // POST: api/Suppliers/register
        [HttpPost("register")]
        public async Task<IActionResult> RegisterSeller([FromBody] SellerRegistrationRequest request)
        {
            if (string.IsNullOrEmpty(request.BusinessName) || string.IsNullOrEmpty(request.FullName) || string.IsNullOrEmpty(request.MobileNumber))
            {
                return BadRequest(new { Success = false, Message = "Full Name, Business Name, and Mobile Number are required." });
            }

            string trackingId = "SEL" + new Random().Next(100000, 999999).ToString();

            var supplier = new Supplier
            {
                Name = request.BusinessName,
                ContactPerson = request.FullName,
                Phone = request.MobileNumber,
                Email = request.EmailAddress,
                Address = request.BusinessAddress,
                Gstin = request.GstinNumber,
                ProductCategory = request.ProductCategory,
                TrackingId = trackingId,
                Status = "Pending",
                IsActive = false // requires verification
            };

            _context.Suppliers.Add(supplier);

            // Notify Admin
            var notification = new Notification
            {
                Title = "New Seller Application",
                Message = $"Seller registration request submitted by {request.FullName} ({request.BusinessName}). Tracking ID: {trackingId}",
                Type = "NewSupplier",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                TrackingId = trackingId,
                Message = "Application submitted successfully."
            });
        }

        public class SupplierStatusUpdateRequest
        {
            public string Status { get; set; } = string.Empty; // Approved or Rejected
        }

        // PUT: api/Suppliers/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] SupplierStatusUpdateRequest request)
        {
            if (string.IsNullOrEmpty(request.Status))
            {
                return BadRequest(new { Success = false, Message = "Status is required." });
            }

            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return NotFound(new { Success = false, Message = "Supplier not found." });
            }

            string targetStatus = request.Status;
            if (request.Status.Equals("Verify", StringComparison.OrdinalIgnoreCase) || 
                request.Status.Equals("Verified", StringComparison.OrdinalIgnoreCase) || 
                request.Status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
            {
                targetStatus = "Approved";
                supplier.IsActive = true;
            }
            else
            {
                targetStatus = "Rejected";
                supplier.IsActive = false;
            }

            supplier.Status = targetStatus;

            // Notify Admin
            var notification = new Notification
            {
                Title = $"Seller Application {targetStatus.ToUpper()}",
                Message = $"Seller request for '{supplier.Name}' (Tracking ID: {supplier.TrackingId ?? "N/A"}) has been {targetStatus.ToLower()}.",
                Type = targetStatus == "Approved" ? "SupplierApproved" : "SupplierRejected",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return Ok(new { Success = true, Message = $"Supplier verification status successfully updated to {targetStatus}.", Data = supplier });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Supplier updateData)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return NotFound(new { Message = "Supplier not found." });
            }

            supplier.Name = updateData.Name;
            supplier.ContactPerson = updateData.ContactPerson;
            supplier.Phone = updateData.Phone;
            supplier.Email = updateData.Email;
            supplier.Address = updateData.Address;
            supplier.ProductCount = updateData.ProductCount;
            supplier.PerformanceRating = updateData.PerformanceRating;
            supplier.CommercialTerms = updateData.CommercialTerms;
            supplier.IsActive = updateData.IsActive;

            // If updated by form, let them sync gstin/category
            if (!string.IsNullOrEmpty(updateData.Gstin)) supplier.Gstin = updateData.Gstin;
            if (!string.IsNullOrEmpty(updateData.ProductCategory)) supplier.ProductCategory = updateData.ProductCategory;
            if (!string.IsNullOrEmpty(updateData.Status)) supplier.Status = updateData.Status;

            // Notify Admin
            var notification = new Notification
            {
                Title = "Supplier Profile updated",
                Message = $"Supplier '{supplier.Name}' profile details updated.",
                Type = "SupplierUpdated",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return NotFound(new { Message = "Supplier not found." });
            }

            _context.Suppliers.Remove(supplier);

            // Notify Admin
            var notification = new Notification
            {
                Title = "Supplier removed",
                Message = $"Supplier '{supplier.Name}' removed from catalog.",
                Type = "SupplierDeleted",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
