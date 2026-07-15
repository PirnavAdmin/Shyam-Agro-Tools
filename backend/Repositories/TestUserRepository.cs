using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Repositories
{
    public class TestUserRepository : ITestUserRepository
    {
        private readonly ApplicationDbContext _context;

        public TestUserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TestUser?> GetByMobileAsync(string mobileNumber)
        {
            return await _context.TestUsers
                .FirstOrDefaultAsync(x => x.MobileNumber == mobileNumber);
        }

        public async Task<TestUser> AddAsync(TestUser user)
        {
            _context.TestUsers.Add(user);

            await _context.SaveChangesAsync();

            return user;
        }

        public async Task UpdateAsync(TestUser user)
        {
            _context.TestUsers.Update(user);

            await _context.SaveChangesAsync();
        }

        public async Task<List<TestUser>> GetAllAsync()
        {
            return await _context.TestUsers.ToListAsync();
        }

        public async Task DeleteAsync(TestUser user)
        {
            _context.TestUsers.Remove(user);

            await _context.SaveChangesAsync();
        }
    }
}

