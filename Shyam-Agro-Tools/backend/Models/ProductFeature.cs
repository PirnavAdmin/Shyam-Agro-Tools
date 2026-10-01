namespace ShyamAgroSuite.Api.Models
{
    public class ProductFeature
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string Feature { get; set; } = string.Empty;
    }
}
