using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Services.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        string GenerateTokenForTestUser(TestUser user);
    }
}