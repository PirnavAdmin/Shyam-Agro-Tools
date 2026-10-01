using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    [Table("notification_templates")]
    public class NotificationTemplate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string TemplateKey { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Channel { get; set; } = "SMS";

        [Required]
        public string Body { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
