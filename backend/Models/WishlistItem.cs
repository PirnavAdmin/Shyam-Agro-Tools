using System;
using System.ComponentModel.DataAnnotations;

namespace ShyamAgroSuite.Api.Models
{
    public class WishlistItem
    {
        [Key]
        public int Id { get; set; }

        public string UserPhone { get; set; } = string.Empty;

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
