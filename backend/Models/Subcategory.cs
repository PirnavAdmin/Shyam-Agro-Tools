using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.Models
{
    public class Subcategory
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        
        [JsonIgnore]
        public Category? Category { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;

        [NotMapped]
        public string Slug => string.IsNullOrEmpty(Name) ? string.Empty : Name.ToLower()
                                  .Replace(" \u0026 ", "-and-")
                                  .Replace("\u0026", "-and-")
                                  .Replace(" & ", "-and-")
                                  .Replace("&", "-and-")
                                  .Replace(" ", "-")
                                  .Replace("/", "-")
                                  .Replace("\\", "-")
                                  .Trim('-');

        [NotMapped]
        public string SubcategoryName => Name;

        [NotMapped]
        public string subcategory_name => Name;

    }
}
