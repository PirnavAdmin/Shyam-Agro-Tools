namespace ShyamAgroSuite.Api.Models
{
    public class UserDto
    {
        public int Id { get; set; }

        public string MobileNumber { get; set; } = string.Empty;

        public string? FullName { get; set; }

        public string? Email { get; set; }

        public string? ProfileImageUrl { get; set; }

        public string? DoorNo { get; set; }

        public string? StreetArea { get; set; }

        public string? City { get; set; }

        public string? State { get; set; }

        public string? Pincode { get; set; }
    }
}
