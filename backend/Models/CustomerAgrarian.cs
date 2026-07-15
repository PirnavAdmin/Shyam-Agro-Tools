using System;
using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.Models
{
    public class CustomerAgrarian
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }

        [JsonIgnore]
        public Customer? Customer { get; set; }

        public string SoilType { get; set; } = string.Empty;        // e.g. Black Clayey, Sandy, Red
        public string CropType { get; set; } = string.Empty;        // e.g. Sugarcane, Cotton, Wheat, Rice
        public double FarmSizeAcres { get; set; }
        public string IrrigationSource { get; set; } = string.Empty; // e.g. Borewell, Canal, Drip
    }
}
