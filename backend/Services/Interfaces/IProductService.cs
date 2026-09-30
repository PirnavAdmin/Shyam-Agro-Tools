using ShyamAgroSuite.Api.DTOs.Catalog;
using ShyamAgroSuite.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ShyamAgroSuite.Api.Services.Interfaces
{
    public interface IProductService
    {
        Task<List<Product>> GetAllProducts();
        Task<Product?> GetProductById(int id);
        Task<string> CreateProduct(CreateProductDto dto);
        Task<string> UpdateProduct(int id, CreateProductDto dto);
        Task<string> DeleteProduct(int id);
    }
}
