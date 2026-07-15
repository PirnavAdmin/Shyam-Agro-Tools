using System.Collections.Generic;
using System.Threading.Tasks;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Repositories.Interfaces
{
    public interface IBlogRepository
    {
        Task<List<Blog>> GetAllAsync();

        Task<Blog?> GetByIdAsync(int id);

        Task AddAsync(Blog blog);

        Task UpdateAsync(Blog blog);

        Task DeleteAsync(Blog blog);

        Task SaveAsync();
    }
}
