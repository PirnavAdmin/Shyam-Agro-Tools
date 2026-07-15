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
    public class CallHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CallHistoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/CallHistory
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] string? priority)
        {
            var query = _context.CallLogs.AsQueryable();

            // Calculate card metrics across all logged calls
            var allCalls = await _context.CallLogs.ToListAsync();
            var todayUtc = DateTime.UtcNow.Date;

            int totalCalls = allCalls.Count;
            
            // Due callback today
            int todayFollowUps = allCalls.Count(c => 
                c.Status.Equals("Follow-Up", StringComparison.OrdinalIgnoreCase) && 
                c.CallbackTime.HasValue && 
                c.CallbackTime.Value.Date == todayUtc
            );

            // Total follow-ups
            int totalFollowUps = allCalls.Count(c => c.Status.Equals("Follow-Up", StringComparison.OrdinalIgnoreCase));
            
            // Qualified leads count
            int qualifiedLeads = allCalls.Count(c => c.IsQualifiedLead);

            // Apply search keywords (Customer Name, Rep, Phone, Email, Notes)
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(c => 
                    c.CustomerName.ToLower().Contains(s) || 
                    c.CalledByRep.ToLower().Contains(s) || 
                    c.CustomerPhone.Contains(s) || 
                    c.CustomerEmail.ToLower().Contains(s) || 
                    c.NotesSummary.ToLower().Contains(s)
                );
            }

            // Apply status filters
            if (!string.IsNullOrEmpty(status) && !status.Equals("All Statuses", StringComparison.OrdinalIgnoreCase))
            {
                var stLower = status.ToLower();
                query = query.Where(c => c.Status.ToLower() == stLower);
            }

            // Apply priority filters
            if (!string.IsNullOrEmpty(priority) && !priority.Equals("All Priorities", StringComparison.OrdinalIgnoreCase))
            {
                var prLower = priority.ToLower();
                query = query.Where(c => c.Priority.ToLower() == prLower);
            }

            var logs = await query.OrderByDescending(c => c.LastCallTime).ToListAsync();

            var formattedLogs = logs.Select(c => new
            {
                c.Id,
                CustomerName = c.CustomerName,
                CalledByRep = c.CalledByRep,
                CustomerPhone = c.CustomerPhone,
                CustomerEmail = c.CustomerEmail,
                Status = c.Status, // e.g. "Follow-Up", "Completed"
                Priority = c.Priority.ToUpper(), // "HIGH", "MEDIUM", "LOW"
                NotesSummary = c.NotesSummary,
                LastCall = c.LastCallTime.ToString("dd MMM yyyy, hh:mm tt"),
                Callback = c.CallbackTime.HasValue ? c.CallbackTime.Value.ToString("dd MMM yyyy, hh:mm tt") : null,
                IsTodayFollowUp = c.Status.Equals("Follow-Up", StringComparison.OrdinalIgnoreCase) && c.CallbackTime.HasValue && c.CallbackTime.Value.Date == todayUtc,
                IsQualifiedLead = c.IsQualifiedLead
            }).ToList();

            return Ok(new
            {
                TotalCalls = totalCalls,
                TodayFollowUps = todayFollowUps,
                TotalFollowUps = totalFollowUps,
                QualifiedLeads = qualifiedLeads,
                Calls = formattedLogs
            });
        }

        // POST: api/CallHistory
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CallLogCreateRequest request)
        {
            if (string.IsNullOrEmpty(request.CustomerName) || string.IsNullOrEmpty(request.CustomerPhone))
            {
                return BadRequest(new { Message = "Customer Name and Customer Phone are required." });
            }

            var cleanStatus = request.Status ?? "Completed";
            if (cleanStatus.Equals("Follow-up Needed", StringComparison.OrdinalIgnoreCase))
            {
                cleanStatus = "Follow-Up";
            }

            var log = new CallLog
            {
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                CustomerEmail = request.CustomerEmail ?? "",
                CalledByRep = request.CalledByRep ?? "System Rep",
                Status = cleanStatus,
                Priority = request.Priority ?? "Low",
                NotesSummary = request.NotesSummary ?? "",
                LastCallTime = request.LastCallTime ?? DateTime.UtcNow,
                CallbackTime = request.CallbackTime,
                IsQualifiedLead = request.IsQualifiedLead
            };

            _context.CallLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Call log created successfully.",
                Id = log.Id,
                CustomerName = log.CustomerName,
                Status = log.Status
            });
        }

        // PUT: api/CallHistory/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CallLogUpdateRequest request)
        {
            var log = await _context.CallLogs.FindAsync(id);
            if (log == null)
            {
                return NotFound(new { Message = "Call log not found." });
            }

            if (!string.IsNullOrEmpty(request.CustomerName)) log.CustomerName = request.CustomerName;
            if (!string.IsNullOrEmpty(request.CustomerPhone)) log.CustomerPhone = request.CustomerPhone;
            if (!string.IsNullOrEmpty(request.CustomerEmail)) log.CustomerEmail = request.CustomerEmail;
            if (!string.IsNullOrEmpty(request.CalledByRep)) log.CalledByRep = request.CalledByRep;
            if (request.LastCallTime.HasValue) log.LastCallTime = request.LastCallTime.Value;
            
            if (!string.IsNullOrEmpty(request.Status))
            {
                var cleanStatus = request.Status;
                if (cleanStatus.Equals("Follow-up Needed", StringComparison.OrdinalIgnoreCase))
                {
                    cleanStatus = "Follow-Up";
                }
                log.Status = cleanStatus;
            }
            
            if (!string.IsNullOrEmpty(request.Priority)) log.Priority = request.Priority;
            if (!string.IsNullOrEmpty(request.NotesSummary)) log.NotesSummary = request.NotesSummary;
            
            if (request.CallbackTimeSpecified) log.CallbackTime = request.CallbackTime;
            if (request.IsQualifiedLead.HasValue) log.IsQualifiedLead = request.IsQualifiedLead.Value;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/CallHistory/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var log = await _context.CallLogs.FindAsync(id);
            if (log == null)
            {
                return NotFound(new { Message = "Call log not found." });
            }

            _context.CallLogs.Remove(log);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        public class CallLogCreateRequest
        {
            public string CustomerName { get; set; } = string.Empty;
            public string CustomerPhone { get; set; } = string.Empty;
            public string? CustomerEmail { get; set; }
            public string? CalledByRep { get; set; }
            public string? Status { get; set; }
            public string? Priority { get; set; }
            public string? NotesSummary { get; set; }
            public DateTime? LastCallTime { get; set; }
            public DateTime? CallbackTime { get; set; }
            public bool IsQualifiedLead { get; set; }
        }

        public class CallLogUpdateRequest
        {
            public string? CustomerName { get; set; }
            public string? CustomerPhone { get; set; }
            public string? CustomerEmail { get; set; }
            public string? CalledByRep { get; set; }
            public string? Status { get; set; }
            public string? Priority { get; set; }
            public string? NotesSummary { get; set; }
            public DateTime? LastCallTime { get; set; }
            public DateTime? CallbackTime { get; set; }
            public bool CallbackTimeSpecified { get; set; } = false; // Helper flag to specify nulling callback times
            public bool? IsQualifiedLead { get; set; }
        }
    }
}
