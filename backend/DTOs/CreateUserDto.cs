namespace ShyamAgroSuite.Api.DTOs
{
    public class CreateUserDto
    {
        public string Email { get; set; }

        public string Password { get; set; }

        public string ConfirmPassword { get; set; }

        public string Role { get; set; } // SuperAdmin or Admin
    }
}