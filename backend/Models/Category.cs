using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShyamAgroSuite.Api.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
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
        public string CategoryName => Name;

        [NotMapped]
        public string category_name => Name;

        [NotMapped]
        public string CategoryDescription => Description;

        public List<Subcategory> Subcategories { get; set; } = new();
    }
}
