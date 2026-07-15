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
    public class SupportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SupportController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Support/config
        [HttpGet("config")]
        public async Task<IActionResult> GetSupportConfig()
        {
            var config = await _context.SupportConfigs.FirstOrDefaultAsync();
            if (config != null)
            {
                return Ok(new
                {
                    supportPhoneNumber = config.SupportPhoneNumber,
                    workTimings = config.WorkTimings,
                    supportEmail = config.SupportEmail
                });
            }

            return Ok(new
            {
                supportPhoneNumber = "+91 98765 43210",
                workTimings = "Mon-Sat: 10AM - 7PM",
                supportEmail = "support@shyamagro.com"
            });
        }

        // PUT: api/Support/config
        [HttpPut("config")]
        public async Task<IActionResult> UpdateSupportConfig([FromBody] SupportConfig request)
        {
            if (string.IsNullOrEmpty(request.SupportPhoneNumber) || string.IsNullOrEmpty(request.WorkTimings))
            {
                return BadRequest(new { Success = false, Message = "SupportPhoneNumber and WorkTimings are required." });
            }

            var config = await _context.SupportConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new SupportConfig();
                _context.SupportConfigs.Add(config);
            }

            config.SupportPhoneNumber = request.SupportPhoneNumber;
            config.WorkTimings = request.WorkTimings;
            config.SupportEmail = string.IsNullOrEmpty(request.SupportEmail) ? "support@shyamagro.com" : request.SupportEmail;
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { Success = true, Message = "Support config updated successfully.", Data = config });
        }

        public class BotChatRequest
        {
            public string Message { get; set; } = string.Empty;
        }

        // POST: api/Support/bot/chat
        [HttpPost("bot/chat")]
        public async Task<IActionResult> BotChat([FromBody] BotChatRequest request)
        {
            if (string.IsNullOrEmpty(request.Message))
            {
                return BadRequest(new { Success = false, Message = "Message is required." });
            }

            string text = request.Message.ToLower();
            string reply = "";
            var suggestedLinks = new List<object>();

            // 1. Check Tracking Policy Keywords
            if (text.Contains("track") || text.Contains("where is my order") || text.Contains("tracking") || text.Contains("status"))
            {
                reply = "To track your order, enter your Order ID / Reference Code in our tracking page. Orders are shipped within 24 hours of payment verification. Shipped orders generally take 3-5 business days to reach your location.";
                suggestedLinks.Add(new { title = "Tracking Policy", path = "/support/tracking-policy", code = "TRACK_POLICY" });
            }
            // 2. Check Return & Refund Keywords
            else if (text.Contains("return") || text.Contains("refund") || text.Contains("cancel") || text.Contains("money back") || text.Contains("replace"))
            {
                reply = "Our Return & Refund policy allows you to return products within 7 days of delivery if they are unused, in original packaging, and contain all tags. Refunds are processed to the original payment source within 5-7 working days after receipt inspection.";
                suggestedLinks.Add(new { title = "Return & Refund", path = "/support/return-refund", code = "RETURN_REFUND" });
            }
            // 3. Check Warranty Keywords
            else if (text.Contains("warranty") || text.Contains("damage") || text.Contains("broken") || text.Contains("repair") || text.Contains("claim") || text.Contains("defect"))
            {
                reply = "All Shyam Agro tools come with a standard 12-month manufacturer warranty covering technical and manufacturing defects. To file a claim, please submit a clear video/photo of the defect along with your tax invoice receipt to our support ticket system.";
                suggestedLinks.Add(new { title = "Warranty Claim", path = "/support/warranty-claim", code = "WARRANTY_CLAIM" });
            }
            // 4. Check Invoice Keywords
            else if (text.Contains("invoice") || text.Contains("bill") || text.Contains("receipt") || text.Contains("download"))
            {
                reply = "You can download the PDF invoice for any successfully verified order by visiting your Account Dashboard, selecting the order history tab, and clicking the 'Download Invoice' button next to the order record.";
                suggestedLinks.Add(new { title = "Download Invoice", path = "/support/download-invoice", code = "DOWNLOAD_INVOICE" });
            }
            // 5. Check Greetings
            else if (text.Contains("hello") || text.Contains("hi") || text.Contains("hey") || text.Contains("greeting"))
            {
                reply = "Hello! I am your Shyam Agro assistant. How can I help you today? You can ask me about order tracking, return policies, warranty claims, or downloading invoices.";
            }
            // 6. Fallback response
            else
            {
                // Dynamic phone retrieval for fallback reply
                var config = await _context.SupportConfigs.FirstOrDefaultAsync();
                string phone = config?.SupportPhoneNumber ?? "+91 98765 43210";
                string email = config?.SupportEmail ?? "support@shyamagro.com";

                reply = $"I'm sorry, I couldn't find a direct answer to your question. Would you like to check our quick links (Tracking Policy, Return & Refund, Warranty Claim) or speak directly to our support team at {phone} or email us at {email}?";
            }

            return Ok(new
            {
                success = true,
                reply = reply,
                suggestedLinks = suggestedLinks
            });
        }

        public class TicketRequest
        {
            public string Name { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Subject { get; set; } = string.Empty;
            public string Message { get; set; } = string.Empty;
        }

        // POST: api/Support/ticket
        [HttpPost("ticket")]
        public async Task<IActionResult> CreateTicket([FromBody] TicketRequest request)
        {
            if (string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Email) || 
                string.IsNullOrEmpty(request.Subject) || string.IsNullOrEmpty(request.Message))
            {
                return BadRequest(new { Success = false, Message = "Name, Email, Subject, and Message are required." });
            }

            var ticket = new SupportTicket
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Subject = request.Subject,
                Message = request.Message,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            _context.SupportTickets.Add(ticket);

            // Add notification trigger for Admin
            var notification = new Notification
            {
                Title = "New Support Ticket",
                Message = $"Support ticket regarding '{request.Subject}' submitted by {request.Name} ({request.Email}).",
                Type = "SupportTicket",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = "Your support ticket was submitted successfully. Support team will contact you shortly.",
                TicketId = ticket.Id
            });
        }

        // GET: api/Support/ticket
        [HttpGet("ticket")]
        public async Task<IActionResult> GetTickets()
        {
            var tickets = await _context.SupportTickets.OrderByDescending(t => t.CreatedAt).ToListAsync();
            return Ok(tickets);
        }
    }
}
