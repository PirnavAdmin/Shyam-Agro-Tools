using System;

namespace ShyamAgroSuite.Api.Models
{
    public class CallLog
    {
        public int Id { get; set; }
        
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        
        public string CalledByRep { get; set; } = string.Empty; // Name of sales rep (e.g. Charan Reddy)
        public string Status { get; set; } = "Completed"; // Follow-Up, Completed
        public string Priority { get; set; } = "Low"; // High, Medium, Low
        
        public string NotesSummary { get; set; } = string.Empty;
        public DateTime LastCallTime { get; set; } = DateTime.UtcNow;
        
        public DateTime? CallbackTime { get; set; } // Scheduled callback time
        public bool IsQualifiedLead { get; set; } = false; // Maps to Qualified Leads count
    }
}
