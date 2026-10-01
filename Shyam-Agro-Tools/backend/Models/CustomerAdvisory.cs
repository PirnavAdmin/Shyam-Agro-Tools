using System;
using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.Models
{
    public class CustomerAdvisory
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }

        [JsonIgnore]
        public Customer? Customer { get; set; }

        public string AdvisoryText { get; set; } = string.Empty;
        public string Recommendation { get; set; } = string.Empty;

        public int StaffId { get; set; }
        public Staff? Staff { get; set; }

        public DateTime DateCreated { get; set; } = DateTime.UtcNow;
    }
}
