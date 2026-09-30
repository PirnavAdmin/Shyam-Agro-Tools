using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.DTOs.Catalog;
using ShyamAgroSuite.Api.Models;
using ShyamAgroSuite.Api.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ShyamAgroSuite.Api.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;

        public ProductService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Product>> GetAllProducts()
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Subcategory)
                .Include(p => p.Images)
                .Include(p => p.Videos)
                .ToListAsync();
        }

        public async Task<Product?> GetProductById(int id)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Subcategory)
                .Include(p => p.Images)
                .Include(p => p.Videos)
                .Include(p => p.Features)
                .Include(p => p.Reviews)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<string> CreateProduct(CreateProductDto dto)
        {
            // Creation logic is handled in the controller (file upload + model mapping)
            return "Create Logic Delegated to Controller";
        }

        public async Task<string> UpdateProduct(int id, CreateProductDto dto)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return "Product not found";

            product.ProductName = dto.ProductName;
            product.SKU = dto.SKU;
            product.Brand = dto.Brand;
            product.Manufacturer = dto.Manufacturer;
            product.MRP = dto.MRP;
            product.Stock = dto.Stock;
            product.CategoryId = dto.CategoryId;
            product.SubcategoryId = dto.SubcategoryId;
            product.ShortDescription = dto.ShortDescription;
            product.ProductDetails = dto.ProductDetails;
            product.PackageIncludes = dto.PackageIncludes;
            product.Weight = dto.Weight;
            product.Dimensions = dto.Dimensions;
            product.PowerSource = dto.PowerSource;
            product.Material = dto.Material;
            product.CoverageUsage = dto.CoverageUsage;
            product.DiscountType = dto.DiscountType;
            product.DiscountAmount = dto.DiscountAmount;
            product.SellingPrice = dto.SellingPrice;
            product.StockStatus = dto.StockStatus ?? string.Empty;
            product.CODAvailability = dto.CODAvailability;
            product.CountryOfOrigin = dto.CountryOfOrigin;
            product.EstimatedDelivery = dto.EstimatedDelivery;
            product.DeliveryReturn = dto.DeliveryReturn;

            await _context.SaveChangesAsync();
            return "Product updated successfully";
        }

        public async Task<string> DeleteProduct(int id)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return "Product not found";

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return "Product deleted successfully";
        }
    }
}

