using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("notification_logs")]
    public class NotificationLog
    {
        [Key]
        public long Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string EventType { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Recipient { get; set; } = string.Empty;

        [Required]
        public string RenderedContent { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Success";

        [MaxLength(200)]
        public string? ProviderMessageId { get; set; }

        public string? ErrorMessage { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
