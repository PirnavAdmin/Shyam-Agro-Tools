using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using ShyamAgroSuite.Api.DTOs.Blog;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.Repositories.Interfaces;
using ShyamAgroSuite.Api.Services.Interfaces;

namespace ShyamAgroSuite.Api.Services
{
    public class BlogService : IBlogService
    {
        private readonly IBlogRepository _repository;
        private readonly IWebHostEnvironment _environment;

        public BlogService(
            IBlogRepository repository,
            IWebHostEnvironment environment)
        {
            _repository = repository;
            _environment = environment;
        }

        public async Task<IEnumerable<BlogResponseDto>> GetAllAsync()
        {
            var blogs = await _repository.GetAllAsync();

            return blogs.Select(x => new BlogResponseDto
            {
                Id = x.Id,
                Title = x.Title,
                Category = x.Category,
                AuthorName = x.AuthorName,
                PublishDate = x.PublishDate,
                CoverImage = x.CoverImage,
                Summary = x.Summary,
                Description = x.Description
            });
        }

        public async Task<BlogResponseDto?> GetByIdAsync(int id)
        {
            var blog = await _repository.GetByIdAsync(id);

            if (blog == null)
                return null;

            return new BlogResponseDto
            {
                Id = blog.Id,
                Title = blog.Title,
                Category = blog.Category,
                AuthorName = blog.AuthorName,
                PublishDate = blog.PublishDate,
                CoverImage = blog.CoverImage,
                Summary = blog.Summary,
                Description = blog.Description
            };
        }

        public async Task<BlogResponseDto> CreateAsync(CreateBlogDto dto)
        {
            string? imagePath = null;

            if (dto.CoverImage != null)
            {
                var folder = Path.Combine(_environment.WebRootPath, "uploads", "blogs");

                if (!Directory.Exists(folder))
                    Directory.CreateDirectory(folder);

                var fileName = Guid.NewGuid().ToString() +
                               Path.GetExtension(dto.CoverImage.FileName);

                var path = Path.Combine(folder, fileName);

                using (var stream = new FileStream(path, FileMode.Create))
                {
                    await dto.CoverImage.CopyToAsync(stream);
                }

                imagePath = "/uploads/blogs/" + fileName;
            }

            var blog = new Blog
            {
                Title = dto.Title,
                Category = dto.Category,
                AuthorName = dto.AuthorName,
                PublishDate = dto.PublishDate,
                CoverImage = imagePath,
                Summary = dto.Summary,
                Description = dto.Description,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _repository.AddAsync(blog);
            await _repository.SaveAsync();

            return new BlogResponseDto
            {
                Id = blog.Id,
                Title = blog.Title,
                Category = blog.Category,
                AuthorName = blog.AuthorName,
                PublishDate = blog.PublishDate,
                CoverImage = blog.CoverImage,
                Summary = blog.Summary,
                Description = blog.Description
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdateBlogDto dto)
        {
            var blog = await _repository.GetByIdAsync(id);

            if (blog == null)
                return false;

            blog.Title = dto.Title;
            blog.Category = dto.Category;
            blog.AuthorName = dto.AuthorName;
            blog.PublishDate = dto.PublishDate;
            blog.Summary = dto.Summary;
            blog.Description = dto.Description;

            if (dto.CoverImage != null)
            {
                var folder = Path.Combine(_environment.WebRootPath, "uploads", "blogs");

                if (!Directory.Exists(folder))
                    Directory.CreateDirectory(folder);

                var fileName = Guid.NewGuid().ToString()
                    + Path.GetExtension(dto.CoverImage.FileName);

                var path = Path.Combine(folder, fileName);

                using (var stream = new FileStream(path, FileMode.Create))
                {
                    await dto.CoverImage.CopyToAsync(stream);
                }

                blog.CoverImage = "/uploads/blogs/" + fileName;
            }

            blog.UpdatedAt = DateTime.Now;

            await _repository.UpdateAsync(blog);
            await _repository.SaveAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var blog = await _repository.GetByIdAsync(id);

            if (blog == null)
                return false;

            await _repository.DeleteAsync(blog);
            await _repository.SaveAsync();

            return true;
        }
    }
}
