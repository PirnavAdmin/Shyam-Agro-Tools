using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.Models
{
    public class Brand
    {
        [System.Text.Json.Serialization.JsonNumberHandling(System.Text.Json.Serialization.JsonNumberHandling.WriteAsString | System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString)]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string LogoImage { get; set; } = string.Empty;
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
        public string BrandIdentifier => $"BRD-{Id:D3}";

    }
}
