using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("SupportConfigs")]
    public class SupportConfig
    {
        [Key]
        public int Id { get; set; }
        public string SupportPhoneNumber { get; set; } = "+91 98765 43210";
        public string WorkTimings { get; set; } = "Mon-Sat: 10AM - 7PM";
        public string SupportEmail { get; set; } = "support@shyamagro.com";
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("SupportTickets")]
    public class SupportTicket
    {
        [Key]
        public int Id { get; set; }
        public string TicketId { get; set; } = string.Empty; // e.g. TCK-88201
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string SourceType { get; set; } = "General"; // Order-Related, Chatbot, General
        public string? OrderReference { get; set; } // e.g. ORD10214 or #ORD10214
        public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
        public string? AssignedAgent { get; set; }
        public string? AuditNote { get; set; } = "No notes added";
        public string Status { get; set; } = "Open"; // Open, InProgress, Resolved
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
