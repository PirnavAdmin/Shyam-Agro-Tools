using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StockController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Stock/ledger
        [HttpGet("ledger")]
        public async Task<IActionResult> GetLedger(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] string? status)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Where(p => p.IsActive)
                .AsQueryable();

            // Calculate metric summaries across all active products
            var allProducts = await _context.Products.Where(p => p.IsActive).ToListAsync();
            
            int totalSkus = allProducts.Count;
            int inStockCount = allProducts.Count(p => p.Stock > p.ReorderLevel);
            int lowStockCount = allProducts.Count(p => p.Stock <= p.ReorderLevel && p.Stock > 0);
            int outOfStockCount = allProducts.Count(p => p.Stock == 0);
            
            decimal totalInventoryValue = allProducts.Sum(p => p.Stock * p.CostPrice);

            // Apply search filters (SKU, Name, Category)
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(p => 
                    p.SKU.ToLower().Contains(s) || 
                    p.ProductName.ToLower().Contains(s) || 
                    (p.Category != null && p.Category.Name.ToLower().Contains(s))
                );
            }

            // Apply category filter
            if (!string.IsNullOrEmpty(category) && !category.Equals("All Categories", StringComparison.OrdinalIgnoreCase))
            {
                var catLower = category.ToLower();
                query = query.Where(p => p.Category != null && p.Category.Name.ToLower() == catLower);
            }

            // Apply status filter
            if (!string.IsNullOrEmpty(status) && !status.Equals("All Statuses", StringComparison.OrdinalIgnoreCase))
            {
                if (status.Equals("In Stock", StringComparison.OrdinalIgnoreCase) || status.Equals("InStock", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => p.Stock > p.ReorderLevel);
                }
                else if (status.Equals("Low Stock", StringComparison.OrdinalIgnoreCase) || status.Equals("LowStock", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => p.Stock <= p.ReorderLevel && p.Stock > 0);
                }
                else if (status.Equals("Out of Stock", StringComparison.OrdinalIgnoreCase) || status.Equals("OutOfStock", StringComparison.OrdinalIgnoreCase) || status.Equals("Out", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => p.Stock == 0);
                }
            }

            var filteredProducts = await query.ToListAsync();

            var ledgerEntries = filteredProducts.Select(p =>
            {
                var displayStatus = "In Stock";
                if (p.Stock == 0)
                {
                    displayStatus = "Out of Stock";
                }
                else if (p.Stock <= p.ReorderLevel)
                {
                    displayStatus = "Low Stock";
                }

                return new
                {
                    p.Id,
                    ProductName = p.ProductName,
                    SKU = p.SKU,
                    CategoryName = p.Category?.Name ?? "General",
                    SupplierName = p.SupplierName ?? "AquaFlow Pvt Ltd",
                    CurrentStock = p.Stock,
                    ReorderLevel = p.ReorderLevel,
                    Status = displayStatus,
                    Trend30Day = p.Trend30Day ?? "+10%",
                    CostPrice = $"₹{p.CostPrice:N0}",
                    SellingPrice = $"₹{(p.SellingPrice ?? p.MRP):N0}",
                    LastUpdated = p.LastUpdated.ToString("yyyy-MM-dd")
                };
            }).ToList();

            return Ok(new
            {
                TotalSkus = totalSkus,
                InStock = inStockCount,
                LowStock = lowStockCount,
                OutOfStock = outOfStockCount,
                InventoryValue = $"₹{totalInventoryValue:N0}",
                Products = ledgerEntries
            });
        }

        // POST: api/Stock/adjust/{productId}
        [HttpPost("adjust/{productId}")]
        public async Task<IActionResult> AdjustStock(int productId, [FromBody] StockAdjustmentRequest request)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null)
            {
                return NotFound(new { Message = "Product not found." });
            }

            if (request.Quantity <= 0)
            {
                return BadRequest(new { Message = "Quantity must be greater than zero." });
            }

            int oldStock = product.Stock;
            int newStock = oldStock;

            if (request.ActionType.Equals("ADD", StringComparison.OrdinalIgnoreCase))
            {
                newStock = oldStock + request.Quantity;
            }
            else if (request.ActionType.Equals("REMOVE", StringComparison.OrdinalIgnoreCase))
            {
                newStock = oldStock - request.Quantity;
                if (newStock < 0) newStock = 0;
            }
            else
            {
                return BadRequest(new { Message = "ActionType must be either ADD or REMOVE." });
            }

            // Update product stock and last updated fields
            product.Stock = newStock;
            product.LastUpdated = DateTime.UtcNow;

            // Log adjustment audit entry
            var log = new StockLedgerLog
            {
                ProductId = productId,
                ActionType = request.ActionType.ToUpper(),
                Quantity = request.Quantity,
                Reason = request.Reason,
                Note = request.Note,
                Timestamp = DateTime.UtcNow
            };

            _context.StockLedgerLogs.Add(log);
            await _context.SaveChangesAsync();

            var displayStatus = "In Stock";
            if (product.Stock == 0)
            {
                displayStatus = "Out of Stock";
            }
            else if (product.Stock <= product.ReorderLevel)
            {
                displayStatus = "Low Stock";
            }

            return Ok(new
            {
                Message = "Stock adjusted successfully.",
                ProductId = product.Id,
                ProductName = product.ProductName,
                OldStock = oldStock,
                NewStock = product.Stock,
                Status = displayStatus,
                LastUpdated = product.LastUpdated.ToString("yyyy-MM-dd")
            });
        }

        // GET: api/Stock/adjustments
        [HttpGet("adjustments")]
        public async Task<IActionResult> GetAdjustments()
        {
            var logs = await _context.StockLedgerLogs
                .Include(l => l.Product)
                .OrderByDescending(l => l.Timestamp)
                .Select(l => new
                {
                    l.Id,
                    ProductId = l.ProductId,
                    ProductName = l.Product != null ? l.Product.ProductName : "Unknown",
                    l.ActionType,
                    l.Quantity,
                    l.Reason,
                    l.Note,
                    Date = l.Timestamp.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync();

            return Ok(logs);
        }

        // POST: api/Stock/entry
        [HttpPost("entry")]
        public async Task<IActionResult> CreateStockEntry([FromBody] NewStockEntryRequest request)
        {
            if (string.IsNullOrEmpty(request.ProductName) || string.IsNullOrEmpty(request.SKU))
            {
                return BadRequest(new { Message = "Product Name and SKU Code are required." });
            }

            // Check duplicate SKU
            var skuExists = await _context.Products.AnyAsync(p => p.SKU == request.SKU);
            if (skuExists)
            {
                return BadRequest(new { Message = $"SKU Code '{request.SKU}' already exists in ledger." });
            }

            // Handle Category (lookup or default)
            int categoryId = request.CategoryId ?? 7; // Default to Farm & garden if not selected
            
            // Handle Subcategory (lookup or create)
            int subcategoryId = 3; // Default to Special Farm Tools
            if (!string.IsNullOrEmpty(request.SubcategoryName))
            {
                var subcat = await _context.Subcategories.FirstOrDefaultAsync(s => s.Name.ToLower() == request.SubcategoryName.ToLower());
                if (subcat == null)
                {
                    subcat = new Subcategory { Name = request.SubcategoryName, CategoryId = categoryId };
                    _context.Subcategories.Add(subcat);
                    await _context.SaveChangesAsync();
                }
                subcategoryId = subcat.Id;
            }

            var product = new Product
            {
                ProductName = request.ProductName,
                SKU = request.SKU,
                CategoryId = categoryId,
                SubcategoryId = subcategoryId,
                Stock = request.InitialStockQty,
                ReorderLevel = request.ReorderLevel,
                CostPrice = request.CostPrice,
                MRP = request.SellingPrice,
                SellingPrice = request.SellingPrice,
                SupplierName = request.SupplierName ?? "Unknown Supplier",
                Trend30Day = "+0%",
                LastUpdated = DateTime.UtcNow,
                IsActive = true,
                Brand = request.SupplierName ?? "Shyam Agro",
                Manufacturer = request.SupplierName ?? "Shyam Agro",
                StockStatus = request.InitialStockQty > 0 ? "InStock" : "OutOfStock",
                AverageRating = 0,
                TotalReviews = 0
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Log initial stock ledger entry if greater than 0
            if (request.InitialStockQty > 0)
            {
                var log = new StockLedgerLog
                {
                    ProductId = product.Id,
                    ActionType = "ADD",
                    Quantity = request.InitialStockQty,
                    Reason = "Initial Stock Registry",
                    Note = "Registered SKU into ledger system.",
                    Timestamp = DateTime.UtcNow
                };
                _context.StockLedgerLogs.Add(log);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                Message = "New stock entry registered successfully.",
                ProductId = product.Id,
                ProductName = product.ProductName,
                SKU = product.SKU,
                InitialStock = product.Stock
            });
        }

        public class NewStockEntryRequest
        {
            public string ProductName { get; set; } = string.Empty;
            public string SKU { get; set; } = string.Empty;
            public int? CategoryId { get; set; }
            public string? SubcategoryName { get; set; }
            public string? SupplierName { get; set; }
            public int InitialStockQty { get; set; }
            public int ReorderLevel { get; set; } = 30;
            public string? StockUnit { get; set; }
            public decimal CostPrice { get; set; }
            public decimal SellingPrice { get; set; }
        }

        public class StockAdjustmentRequest
        {
            public string ActionType { get; set; } = "ADD"; // ADD or REMOVE
            public int Quantity { get; set; }
            public string Reason { get; set; } = string.Empty;
            public string? Note { get; set; }
        }
    }
}
