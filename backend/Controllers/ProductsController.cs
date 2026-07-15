using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.DTOs.Catalog;
using ShyamAgroSuite.Api.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace ShyamAgroSuite.Api.Controllers
{
    [Route("api/products")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/products
        [HttpGet]
        public IActionResult GetAll()
        {
            var products = _context.Products
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .ToList();

            return Ok(products);
        }

        // GET: api/products/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var product = _context.Products
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .FirstOrDefault(x => x.Id == id);

            if (product == null)
                return NotFound();

            return Ok(product);
        }

        // POST: api/products
        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromForm] CreateProductDto dto)
        {
            // Fallback for CategoryId
            if (dto.CategoryId <= 0)
            {
                var firstCat = await _context.Categories.FirstOrDefaultAsync();
                if (firstCat != null) dto.CategoryId = firstCat.Id;
            }
            else
            {
                bool categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
                if (!categoryExists)
                {
                    var firstCat = await _context.Categories.FirstOrDefaultAsync();
                    if (firstCat != null) dto.CategoryId = firstCat.Id;
                }
            }

            // Fallback for SubcategoryId
            if (dto.SubcategoryId <= 0)
            {
                var firstSub = await _context.Subcategories.FirstOrDefaultAsync(s => s.CategoryId == dto.CategoryId) 
                               ?? await _context.Subcategories.FirstOrDefaultAsync();
                if (firstSub != null) dto.SubcategoryId = firstSub.Id;
            }
            else
            {
                bool subcategoryExists = await _context.Subcategories.AnyAsync(s => s.Id == dto.SubcategoryId);
                if (!subcategoryExists)
                {
                    var firstSub = await _context.Subcategories.FirstOrDefaultAsync(s => s.CategoryId == dto.CategoryId) 
                                   ?? await _context.Subcategories.FirstOrDefaultAsync();
                    if (firstSub != null) dto.SubcategoryId = firstSub.Id;
                }
            }

            // Save images with dynamic validation & default placeholder support
            var productImages = new List<ProductImage>();
            string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

            if (dto.Images != null && dto.Images.Count > 0)
            {
                var imagesFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "images");
                Directory.CreateDirectory(imagesFolder);

                foreach (var image in dto.Images)
                {
                    var extension = Path.GetExtension(image.FileName).ToLower();
                    if (!allowedExtensions.Contains(extension))
                        continue; // Skip invalid file formats instead of crashing

                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
                    var filePath = Path.Combine(imagesFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                        await image.CopyToAsync(stream);

                    productImages.Add(new ProductImage { ImageUrl = "/uploads/images/" + fileName });
                }
            }

            // Attach default placeholder if no images were successfully saved
            if (productImages.Count == 0)
            {
                productImages.Add(new ProductImage { ImageUrl = "/uploads/images/placeholder.png" });
            }

            // Save video (optional)
            string? videoPath = null;
            if (dto.Video != null)
            {
                var videosFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "videos");
                Directory.CreateDirectory(videosFolder);

                var videoFileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.Video.FileName);
                var videoFullPath = Path.Combine(videosFolder, videoFileName);

                using (var stream = new FileStream(videoFullPath, FileMode.Create))
                    await dto.Video.CopyToAsync(stream);

                videoPath = "/uploads/videos/" + videoFileName;
            }

            // Handle Features
            var featuresList = new List<ProductFeature>();
            if (dto.Features != null && dto.Features.Count > 0)
            {
                foreach (var f in dto.Features)
                {
                    if (!string.IsNullOrWhiteSpace(f))
                        featuresList.Add(new ProductFeature { Feature = f });
                }
            }
            else if (!string.IsNullOrEmpty(dto.FeaturesJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<string>>(dto.FeaturesJson);
                    if (parsed != null)
                    {
                        foreach (var f in parsed)
                        {
                            if (!string.IsNullOrWhiteSpace(f))
                                featuresList.Add(new ProductFeature { Feature = f });
                        }
                    }
                }
                catch
                {
                    try
                    {
                        var parsedComplex = System.Text.Json.JsonSerializer.Deserialize<List<ProductFeatureDto>>(dto.FeaturesJson);
                        if (parsedComplex != null)
                        {
                            foreach (var f in parsedComplex)
                            {
                                if (!string.IsNullOrWhiteSpace(f.Feature))
                                    featuresList.Add(new ProductFeature { Feature = f.Feature });
                            }
                        }
                    }
                    catch { }
                }
            }

            // Handle Reviews
            var reviewsList = new List<ProductReview>();
            if (!string.IsNullOrEmpty(dto.ReviewsJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<ProductReviewDto>>(dto.ReviewsJson);
                    if (parsed != null)
                    {
                        foreach (var r in parsed)
                        {
                            reviewsList.Add(new ProductReview
                            {
                                CustomerName = r.CustomerName,
                                Rating = r.Rating,
                                ReviewComment = r.ReviewComment,
                                VerifiedPurchase = r.VerifiedPurchase,
                                ReviewDate = r.ReviewDate ?? DateTime.Now
                            });
                        }
                    }
                }
                catch { }
            }

            var averageRating = dto.AverageRating;
            var totalReviews = dto.TotalReviews;
            var fiveStar = dto.FiveStar;
            var fourStar = dto.FourStar;
            var threeStar = dto.ThreeStar;
            var twoStar = dto.TwoStar;
            var oneStar = dto.OneStar;

            if (reviewsList.Count > 0)
            {
                totalReviews = reviewsList.Count;
                averageRating = Math.Round((decimal)reviewsList.Average(r => r.Rating), 2);
                fiveStar = reviewsList.Count(r => r.Rating == 5);
                fourStar = reviewsList.Count(r => r.Rating == 4);
                threeStar = reviewsList.Count(r => r.Rating == 3);
                twoStar = reviewsList.Count(r => r.Rating == 2);
                oneStar = reviewsList.Count(r => r.Rating == 1);
            }

            var product = new Product
            {
                ProductName = dto.ProductName,
                SKU = dto.SKU,
                Brand = dto.Brand,
                Manufacturer = dto.Manufacturer,
                MRP = dto.MRP,
                Stock = dto.Stock,
                CategoryId = dto.CategoryId,
                SubcategoryId = dto.SubcategoryId,
                Images = productImages,
                ShortDescription = dto.ShortDescription,
                ProductDetails = dto.ProductDetails,
                PackageIncludes = dto.PackageIncludes,
                Weight = dto.Weight,
                Dimensions = dto.Dimensions,
                PowerSource = dto.PowerSource,
                Material = dto.Material,
                CoverageUsage = dto.CoverageUsage,
                DiscountType = dto.DiscountType,
                DiscountAmount = dto.DiscountAmount,
                SellingPrice = dto.SellingPrice,
                StockStatus = dto.StockStatus ?? string.Empty,
                CODAvailability = dto.CODAvailability,
                CountryOfOrigin = dto.CountryOfOrigin,
                EstimatedDelivery = dto.EstimatedDelivery,
                DeliveryReturn = dto.DeliveryReturn,
                AverageRating = averageRating,
                TotalReviews = totalReviews,
                FiveStar = fiveStar,
                FourStar = fourStar,
                ThreeStar = threeStar,
                TwoStar = twoStar,
                OneStar = oneStar,
                IsActive = dto.IsActive,
                Videos = dto.Video != null
                    ? new List<ProductVideo> { new ProductVideo { VideoUrl = videoPath } }
                    : new List<ProductVideo>(),
                Features = featuresList,
                Reviews = reviewsList
            };

            _context.Products.Add(product);

            // Fetch Category and Subcategory for notification
            var category = await _context.Categories.FindAsync(product.CategoryId);
            var subcategory = await _context.Subcategories.FindAsync(product.SubcategoryId);
            var categoryName = category?.Name ?? "Unknown";
            var subcategoryName = subcategory?.Name ?? "Unknown";

            _context.Notifications.Add(new Notification
            {
                Title = "New Product Added",
                Message = $"Product '{product.ProductName}' added in {categoryName} & {subcategoryName}.",
                Type = "NewProduct"
            });

            // Check low stock
            if (product.Stock <= 10)
            {
                _context.Notifications.Add(new Notification
                {
                    Title = "Low Stock Warning",
                    Message = $"{product.ProductName} is below safety threshold limit ({product.Stock} left).",
                    Type = "LowStock"
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Product created successfully",
                productId = product.Id
            });
        }

        // PUT: api/products/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] CreateProductDto dto)
        {
            var product = await _context.Products
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (product == null)
                return NotFound("Product not found");

            // Fallback for CategoryId
            if (dto.CategoryId <= 0)
            {
                var firstCat = await _context.Categories.FirstOrDefaultAsync();
                if (firstCat != null) dto.CategoryId = firstCat.Id;
            }
            else
            {
                bool categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
                if (!categoryExists)
                {
                    var firstCat = await _context.Categories.FirstOrDefaultAsync();
                    if (firstCat != null) dto.CategoryId = firstCat.Id;
                }
            }

            // Fallback for SubcategoryId
            if (dto.SubcategoryId <= 0)
            {
                var firstSub = await _context.Subcategories.FirstOrDefaultAsync(s => s.CategoryId == dto.CategoryId) 
                               ?? await _context.Subcategories.FirstOrDefaultAsync();
                if (firstSub != null) dto.SubcategoryId = firstSub.Id;
            }
            else
            {
                bool subcategoryExists = await _context.Subcategories.AnyAsync(s => s.Id == dto.SubcategoryId);
                if (!subcategoryExists)
                {
                    var firstSub = await _context.Subcategories.FirstOrDefaultAsync(s => s.CategoryId == dto.CategoryId) 
                                   ?? await _context.Subcategories.FirstOrDefaultAsync();
                    if (firstSub != null) dto.SubcategoryId = firstSub.Id;
                }
            }

            // Handle Features
            var featuresList = new List<ProductFeature>();
            if (dto.Features != null && dto.Features.Count > 0)
            {
                foreach (var f in dto.Features)
                {
                    if (!string.IsNullOrWhiteSpace(f))
                        featuresList.Add(new ProductFeature { Feature = f });
                }
            }
            else if (!string.IsNullOrEmpty(dto.FeaturesJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<string>>(dto.FeaturesJson);
                    if (parsed != null)
                    {
                        foreach (var f in parsed)
                        {
                            if (!string.IsNullOrWhiteSpace(f))
                                featuresList.Add(new ProductFeature { Feature = f });
                        }
                    }
                }
                catch
                {
                    try
                    {
                        var parsedComplex = System.Text.Json.JsonSerializer.Deserialize<List<ProductFeatureDto>>(dto.FeaturesJson);
                        if (parsedComplex != null)
                        {
                            foreach (var f in parsedComplex)
                            {
                                if (!string.IsNullOrWhiteSpace(f.Feature))
                                    featuresList.Add(new ProductFeature { Feature = f.Feature });
                            }
                        }
                    }
                    catch { }
                }
            }

            // Handle Reviews
            var reviewsList = new List<ProductReview>();
            if (!string.IsNullOrEmpty(dto.ReviewsJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<ProductReviewDto>>(dto.ReviewsJson);
                    if (parsed != null)
                    {
                        foreach (var r in parsed)
                        {
                            reviewsList.Add(new ProductReview
                            {
                                CustomerName = r.CustomerName,
                                Rating = r.Rating,
                                ReviewComment = r.ReviewComment,
                                VerifiedPurchase = r.VerifiedPurchase,
                                ReviewDate = r.ReviewDate ?? DateTime.Now
                            });
                        }
                    }
                }
                catch { }
            }

            // Update features
            if (featuresList.Count > 0 || !string.IsNullOrEmpty(dto.FeaturesJson) || dto.Features != null)
            {
                _context.ProductFeatures.RemoveRange(product.Features);
                product.Features = featuresList;
            }

            // Update reviews
            if (reviewsList.Count > 0 || !string.IsNullOrEmpty(dto.ReviewsJson))
            {
                _context.ProductReviews.RemoveRange(product.Reviews);
                product.Reviews = reviewsList;
            }

            var averageRating = dto.AverageRating;
            var totalReviews = dto.TotalReviews;
            var fiveStar = dto.FiveStar;
            var fourStar = dto.FourStar;
            var threeStar = dto.ThreeStar;
            var twoStar = dto.TwoStar;
            var oneStar = dto.OneStar;

            if (product.Reviews.Count > 0)
            {
                totalReviews = product.Reviews.Count;
                averageRating = Math.Round((decimal)product.Reviews.Average(r => r.Rating), 2);
                fiveStar = product.Reviews.Count(r => r.Rating == 5);
                fourStar = product.Reviews.Count(r => r.Rating == 4);
                threeStar = product.Reviews.Count(r => r.Rating == 3);
                twoStar = product.Reviews.Count(r => r.Rating == 2);
                oneStar = product.Reviews.Count(r => r.Rating == 1);
            }

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
            product.AverageRating = averageRating;
            product.TotalReviews = totalReviews;
            product.FiveStar = fiveStar;
            product.FourStar = fourStar;
            product.ThreeStar = threeStar;
            product.TwoStar = twoStar;
            product.OneStar = oneStar;
            product.IsActive = dto.IsActive;

            // Handle images update if new images are uploaded
            if (dto.Images != null && dto.Images.Count > 0)
            {
                string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
                foreach (var image in dto.Images)
                {
                    var extension = Path.GetExtension(image.FileName).ToLower();
                    if (!allowedExtensions.Contains(extension))
                        continue; // Skip invalid format
                }

                // Delete old physical image files
                var imagesFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "images");
                foreach (var img in product.Images)
                {
                    var relativePath = img.ImageUrl.TrimStart('/');
                    var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath.Replace('/', Path.DirectorySeparatorChar));
                    if (System.IO.File.Exists(fullPath))
                    {
                        System.IO.File.Delete(fullPath);
                    }
                }

                // Clear existing records and add new ones
                product.Images.Clear();
                Directory.CreateDirectory(imagesFolder);

                foreach (var image in dto.Images)
                {
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
                    var filePath = Path.Combine(imagesFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                        await image.CopyToAsync(stream);

                    product.Images.Add(new ProductImage { ImageUrl = "/uploads/images/" + fileName });
                }
            }

            // Handle video update if a new video is uploaded
            if (dto.Video != null)
            {
                // Delete old physical video files
                var videosFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "videos");
                foreach (var v in product.Videos)
                {
                    var relativePath = v.VideoUrl.TrimStart('/');
                    var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath.Replace('/', Path.DirectorySeparatorChar));
                    if (System.IO.File.Exists(fullPath))
                    {
                        System.IO.File.Delete(fullPath);
                    }
                }

                // Clear existing records and add new one
                product.Videos.Clear();
                Directory.CreateDirectory(videosFolder);

                var videoFileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.Video.FileName);
                var videoFullPath = Path.Combine(videosFolder, videoFileName);

                using (var stream = new FileStream(videoFullPath, FileMode.Create))
                    await dto.Video.CopyToAsync(stream);

                product.Videos.Add(new ProductVideo { VideoUrl = "/uploads/videos/" + videoFileName });
            }

            // Check low stock
            if (product.Stock <= 10)
            {
                var existsLowStock = await _context.Notifications.AnyAsync(n => n.Type == "LowStock" && n.Message.Contains(product.ProductName) && !n.IsRead);
                if (!existsLowStock)
                {
                    _context.Notifications.Add(new Notification
                    {
                        Title = "Low Stock Warning",
                        Message = $"{product.ProductName} is below safety threshold limit ({product.Stock} left).",
                        Type = "LowStock"
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok("Product updated successfully");
        }

        // DELETE: api/products/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = _context.Products.FirstOrDefault(x => x.Id == id);

            if (product == null)
                return NotFound("Product not found");

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok("Product deleted successfully");
        }

        // GET: api/products/search?keyword=xyz
        [HttpGet("search")]
        public IActionResult Search(string keyword)
        {
            var products = _context.Products
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .Where(x => x.ProductName.Contains(keyword) || x.SKU.Contains(keyword))
                .ToList();

            return Ok(products);
        }

        // GET: api/products/paged?page=1&pageSize=10
        [HttpGet("paged")]
        public IActionResult GetPaged(int page = 1, int pageSize = 10)
        {
            var total = _context.Products.Count();
            var products = _context.Products
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(new { total, page, pageSize, data = products });
        }

        // PATCH: api/products/{id}/stock?stock=50
        [HttpPatch("{id}/stock")]
        public async Task<IActionResult> UpdateStock(int id, int stock)
        {
            var product = _context.Products.FirstOrDefault(x => x.Id == id);

            if (product == null)
                return NotFound();

            product.Stock = stock;
            await _context.SaveChangesAsync();

            return Ok("Stock updated");
        }

        // GET: api/products/category/{categoryId}
        [HttpGet("category/{categoryId}")]
        public IActionResult GetByCategory(int categoryId)
        {
            var products = _context.Products
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .Where(x => x.CategoryId == categoryId)
                .ToList();

            return Ok(products);
        }

        // GET: api/products/subcategory/{subcategoryId}
        [HttpGet("subcategory/{subcategoryId}")]
        public IActionResult GetBySubcategory(int subcategoryId)
        {
            var products = _context.Products
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .Where(x => x.SubcategoryId == subcategoryId)
                .ToList();

            return Ok(products);
        }

        // GET: api/products/dashboard
        [HttpGet("dashboard")]
        public IActionResult Dashboard()
        {
            var result = new
            {
                totalProducts = _context.Products.Count(),
                totalCategories = _context.Categories.Count(),
                totalSubcategories = _context.Subcategories.Count()
            };

            return Ok(result);
        }

        // GET: api/products/related/{productId}
        [HttpGet("related/{productId}")]
        public IActionResult GetRelatedProducts(int productId)
        {
            var product = _context.Products.FirstOrDefault(x => x.Id == productId);

            if (product == null)
                return NotFound();

            var relatedProducts = _context.Products
                .Include(x => x.Category)
                .Include(x => x.Subcategory)
                .Include(x => x.Images)
                .Include(x => x.Videos)
                .Include(x => x.Features)
                .Include(x => x.Reviews)
                .Where(x => x.CategoryId == product.CategoryId && x.Id != productId)
                .Take(4)
                .ToList();

            return Ok(relatedProducts);
        }
    }

    public class ProductFeatureDto
    {
        public string Feature { get; set; } = string.Empty;
    }

    public class ProductReviewDto
    {
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string ReviewComment { get; set; } = string.Empty;
        public bool VerifiedPurchase { get; set; }
        public DateTime? ReviewDate { get; set; }
    }
}

