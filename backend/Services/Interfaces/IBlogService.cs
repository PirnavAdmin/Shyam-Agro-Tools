using System.Collections.Generic;
using System.Threading.Tasks;
using ShyamAgroSuite.Api.DTOs.Blog;

namespace ShyamAgroSuite.Api.Services.Interfaces
{
    public interface IBlogService
    {
        Task<IEnumerable<BlogResponseDto>> GetAllAsync();

        Task<BlogResponseDto?> GetByIdAsync(int id);

        Task<BlogResponseDto> CreateAsync(CreateBlogDto dto);

        Task<bool> UpdateAsync(int id, UpdateBlogDto dto);

        Task<bool> DeleteAsync(int id);
    }
}
