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
    public class TicketsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TicketsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Tickets?search=&type=&status=&priority=
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? type,
            [FromQuery] string? status,
            [FromQuery] string? priority)
        {
            var query = _context.SupportTickets.AsQueryable();

            // Calculate metric counts (from all tickets in db before filtering)
            var allTickets = await _context.SupportTickets.ToListAsync();
            var totalTicketsCount = allTickets.Count;
            var openTicketsCount = allTickets.Count(t => t.Status.Equals("Open", StringComparison.OrdinalIgnoreCase));
            var inProgressTicketsCount = allTickets.Count(t => t.Status.Equals("In Progress", StringComparison.OrdinalIgnoreCase) || t.Status.Equals("InProgress", StringComparison.OrdinalIgnoreCase));
            var resolvedTicketsCount = allTickets.Count(t => t.Status.Equals("Resolved", StringComparison.OrdinalIgnoreCase));

            // Apply search filter (Search Ticket ID, Customer Name, Order Reference)
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(t => 
                    t.TicketId.ToLower().Contains(s) || 
                    t.Name.ToLower().Contains(s) || 
                    (t.OrderReference != null && t.OrderReference.ToLower().Contains(s))
                );
            }

            // Apply Type filter
            if (!string.IsNullOrEmpty(type) && !type.Equals("All Types", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => t.SourceType.Equals(type, StringComparison.OrdinalIgnoreCase));
            }

            // Apply Status filter
            if (!string.IsNullOrEmpty(status) && !status.Equals("All Statuses", StringComparison.OrdinalIgnoreCase))
            {
                // Normalize "In Progress" spaces
                if (status.Equals("In Progress", StringComparison.OrdinalIgnoreCase) || status.Equals("InProgress", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(t => t.Status.Equals("In Progress", StringComparison.OrdinalIgnoreCase) || t.Status.Equals("InProgress", StringComparison.OrdinalIgnoreCase));
                }
                else
                {
                    query = query.Where(t => t.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
                }
            }

            // Apply Priority filter
            if (!string.IsNullOrEmpty(priority) && !priority.Equals("All Priorities", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => t.Priority.Equals(priority, StringComparison.OrdinalIgnoreCase));
            }

            var tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

            return Ok(new
            {
                TotalTickets = totalTicketsCount,
                OpenTickets = openTicketsCount,
                InProgress = inProgressTicketsCount,
                Resolved = resolvedTicketsCount,
                Tickets = tickets
            });
        }

        // GET: api/Tickets/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ticket = await _context.SupportTickets.FindAsync(id);
            if (ticket == null)
            {
                return NotFound(new { Message = "Ticket not found." });
            }

            object? linkedOrder = null;
            if (ticket.SourceType.Equals("Order-Related", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(ticket.OrderReference))
            {
                var refClean = ticket.OrderReference.Replace("#", "").Trim();
                var order = await _context.Orders
                    .Include(o => o.Items)
                    .FirstOrDefaultAsync(o => o.OrderNumber.Contains(refClean));

                if (order != null)
                {
                    linkedOrder = new
                    {
                        OrderReference = ticket.OrderReference,
                        OrderStatus = order.Status,
                        TotalValue = $"INR {order.FinalAmount:N0}",
                        Products = order.Items.Select(i => new
                        {
                            ProductName = i.ProductName,
                            Quantity = i.Quantity,
                            Price = $"INR {i.Price:N0}"
                        }).ToList()
                    };
                }
            }

            return Ok(new
            {
                Ticket = ticket,
                LinkedOrder = linkedOrder
            });
        }

        // POST: api/Tickets
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SupportTicket ticket)
        {
            if (string.IsNullOrEmpty(ticket.Name))
            {
                return BadRequest(new { Message = "Customer Name is required." });
            }

            if (string.IsNullOrEmpty(ticket.TicketId))
            {
                ticket.TicketId = $"TCK-{new Random().Next(10000, 99999)}";
            }

            if (string.IsNullOrEmpty(ticket.Status))
            {
                ticket.Status = "Open";
            }

            if (string.IsNullOrEmpty(ticket.Priority))
            {
                ticket.Priority = "Medium";
            }

            if (string.IsNullOrEmpty(ticket.AuditNote))
            {
                ticket.AuditNote = "No notes added";
            }

            ticket.CreatedAt = DateTime.UtcNow;

            _context.SupportTickets.Add(ticket);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
        }

        // PUT: api/Tickets/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTicketRequest request)
        {
            var ticket = await _context.SupportTickets.FindAsync(id);
            if (ticket == null)
            {
                return NotFound(new { Message = "Ticket not found." });
            }

            if (request.AssignedAgent != null)
            {
                ticket.AssignedAgent = request.AssignedAgent;
            }

            if (!string.IsNullOrEmpty(request.Priority))
            {
                ticket.Priority = request.Priority;
            }

            if (!string.IsNullOrEmpty(request.Status))
            {
                ticket.Status = request.Status;
            }

            if (!string.IsNullOrEmpty(request.AuditNote))
            {
                ticket.AuditNote = request.AuditNote;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Tickets/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ticket = await _context.SupportTickets.FindAsync(id);
            if (ticket == null)
            {
                return NotFound(new { Message = "Ticket not found." });
            }

            _context.SupportTickets.Remove(ticket);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        public class UpdateTicketRequest
        {
            public string? AssignedAgent { get; set; }
            public string? Priority { get; set; } // Low, Medium, High, Critical
            public string? Status { get; set; } // Open, In Progress, Resolved
            public string? AuditNote { get; set; }
        }
    }
}
