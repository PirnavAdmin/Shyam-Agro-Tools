using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Repositories
{
    public interface ITestUserRepository
    {
        Task<TestUser?> GetByMobileAsync(string mobileNumber);

        Task<TestUser> AddAsync(TestUser user);

        Task UpdateAsync(TestUser user);

        Task<List<TestUser>> GetAllAsync();

        Task DeleteAsync(TestUser user);
    }
}
