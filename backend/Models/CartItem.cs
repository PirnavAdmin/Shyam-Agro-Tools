using System.ComponentModel.DataAnnotations;

namespace ShyamAgroSuite.Api .Models
{
    public class CartItem
    {
        [Key]
        public int CartId { get; set; }

        public int ProductId { get; set; }

        public int Quantity { get; set; }

        public decimal Price { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime CreatedDate { get; set; }
        public decimal TotalPrice { get; internal set; }
        public string UserEmail { get; set; } = string.Empty;
    }
}