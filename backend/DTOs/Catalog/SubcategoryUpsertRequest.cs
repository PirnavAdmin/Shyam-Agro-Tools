namespace ShyamAgroSuite.Api.DTOs.Catalog
{
    public class SubcategoryUpsertRequest
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
