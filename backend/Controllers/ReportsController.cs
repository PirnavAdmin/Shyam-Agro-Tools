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
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/reports/orders?timeFilter=allTime
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrdersAnalytics([FromQuery] string timeFilter = "allTime")
        {
            DateTime? startDate = null;
            var now = DateTime.UtcNow;

            switch (timeFilter.ToLower())
            {
                case "last7days":
                    startDate = now.AddDays(-7);
                    break;
                case "last30days":
                    startDate = now.AddDays(-30);
                    break;
                case "thisyear":
                    startDate = new DateTime(now.Year, 1, 1);
                    break;
                default:
                    // allTime - no filter
                    break;
            }

            var ordersQuery = _context.Orders.AsQueryable();
            if (startDate.HasValue)
            {
                ordersQuery = ordersQuery.Where(o => o.OrderDate >= startDate.Value);
            }

            var ordersList = await ordersQuery
                .Include(o => o.Customer)
                .Include(o => o.Items)
                .ToListAsync();

            // Calculate metrics (excluding Cancelled status if needed, or including them but noting final sales)
            var activeOrders = ordersList.Where(o => o.Status != "Cancelled").ToList();
            var totalSalesRevenue = activeOrders.Sum(o => o.FinalAmount);
            var ordersVolume = activeOrders.Count;
            var averageOrderValue = ordersVolume > 0 ? Math.Round(totalSalesRevenue / ordersVolume, 2) : 0;
            var unconfirmedPaymentsCount = ordersList.Count(o => o.PaymentStatus == "Pending");

            // Group by date for Revenue Performance Trend (e.g. past 7 days or formatted as "dd MMM")
            var trend = activeOrders
                .GroupBy(o => o.OrderDate.ToString("dd MMM"))
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.FinalAmount)
                })
                .ToList();

            // Order Fulfillment States
            var fulfillmentStates = ordersList
                .GroupBy(o => o.Status)
                .Select(g => new
                {
                    State = g.Key,
                    Count = g.Count()
                })
                .ToList();

            // Payment Methods Distribution
            var paymentMethods = ordersList
                .GroupBy(o => string.IsNullOrEmpty(o.PaymentMethod) ? "Unknown" : o.PaymentMethod)
                .Select(g => new
                {
                    Method = g.Key,
                    Count = g.Count()
                })
                .ToList();

            // Detailed Orders Ledger Summary
            var detailedLedger = ordersList
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    Date = o.OrderDate.ToString("dd MMM yyyy"),
                    OrderId = o.OrderNumber,
                    Customer = o.Customer != null ? o.Customer.Name : "Walk-in Customer",
                    ItemsCount = $"{o.Items?.Count ?? 0} items",
                    TotalAmount = $"INR {o.FinalAmount:N0}",
                    PaymentStatus = o.PaymentStatus,
                    FulfillmentStatus = o.Status
                })
                .ToList();

            return Ok(new
            {
                TotalSalesRevenue = $"INR {totalSalesRevenue:N0}",
                OrdersVolume = $"{ordersVolume} Orders",
                AverageOrderValue = $"INR {averageOrderValue:N0}",
                UnconfirmedPayments = $"{unconfirmedPaymentsCount} Pending",
                RevenuePerformanceTrend = trend,
                OrderFulfillmentStates = fulfillmentStates,
                PaymentMethodsDistribution = paymentMethods,
                DetailedOrdersLedger = detailedLedger
            });
        }

        // GET: api/reports/catalog
        [HttpGet("catalog")]
        public async Task<IActionResult> GetCatalogAnalytics()
        {
            var productsList = await _context.Products
                .Include(p => p.Category)
                .ToListAsync();

            var categoriesCount = await _context.Categories.CountAsync();
            var totalProductsCount = productsList.Count;

            var criticalOutOfStock = productsList.Count(p => p.Stock == 0);
            var lowStockWarning = productsList.Count(p => p.Stock > 0 && p.Stock <= 10);

            // Category Allocation Share
            var categoryAllocation = productsList
                .Where(p => p.Category != null)
                .GroupBy(p => p.Category!.Name)
                .Select(g => new
                {
                    CategoryName = g.Key,
                    ProductCount = g.Count()
                })
                .ToList();

            // Lowest Stock Levels Alert
            var lowestStockAlert = productsList
                .OrderBy(p => p.Stock)
                .Take(5)
                .Select(p => new
                {
                    ProductName = p.ProductName,
                    Stock = p.Stock
                })
                .ToList();

            // Catalog Performance Index (top rated / reviews)
            var performanceIndex = productsList
                .OrderByDescending(p => p.AverageRating)
                .Take(5)
                .Select(p => new
                {
                    ProductName = p.ProductName,
                    AverageRating = p.AverageRating,
                    TotalReviews = p.TotalReviews
                })
                .ToList();

            // Catalog Inventory Summary
            var inventorySummary = productsList
                .Select(p => new
                {
                    Sku = p.SKU,
                    ProductName = p.ProductName,
                    Category = p.Category != null ? p.Category.Name : "None",
                    Brand = p.Brand,
                    SellingPrice = $"INR {p.SellingPrice ?? p.MRP:N0}",
                    StockCount = p.Stock,
                    Status = p.Stock == 0 ? "Out of Stock" : (p.Stock <= 10 ? "Low Stock" : "In Stock")
                })
                .ToList();

            return Ok(new
            {
                TotalCatalogProducts = $"{totalProductsCount} Items",
                CategoriesCount = $"{categoriesCount} Classes",
                CriticalOutOfStock = $"{criticalOutOfStock} items",
                LowStockWarning = $"{lowStockWarning} Items",
                CategoryAllocationShare = categoryAllocation,
                LowestStockLevelsAlert = lowestStockAlert,
                CatalogPerformanceIndex = performanceIndex,
                CatalogInventorySummary = inventorySummary
            });
        }

        // POST: api/reports/export
        [HttpPost("export")]
        public IActionResult ExportReport([FromBody] ExportRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.ReportType))
            {
                return BadRequest(new { Message = "Report type is required for export." });
            }

            // Mock CSV/Excel export payload
            var exportUrl = $"https://localhost:7072/exports/{request.ReportType.ToLower()}_{DateTime.UtcNow:yyyyMMdd}.csv";

            return Ok(new
            {
                Message = $"{request.ReportType} report export initiated successfully.",
                ExportUrl = exportUrl,
                GeneratedAt = DateTime.UtcNow
            });
        }

        // PUT: api/reports/settings
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateReportSettings([FromBody] ReportSettingsUpdate request)
        {
            if (request == null)
            {
                return BadRequest(new { Message = "Invalid settings configuration." });
            }

            // Retrieve or mock save report config (updating stock alerts thresholds)
            var settings = await _context.SystemSettings.FirstOrDefaultAsync() ?? new SystemSettings();
            
            // Log setting change mock
            Console.WriteLine($"Report settings updated: LowStockAlertLimit={request.LowStockAlertLimit}");

            return Ok(new
            {
                Message = "Report settings updated successfully.",
                Settings = request
            });
        }

        // DELETE: api/reports/cache
        [HttpDelete("cache")]
        public IActionResult ClearReportCache()
        {
            // Clear report cache mock
            return Ok(new
            {
                Message = "Analytics report cache cleared successfully.",
                ClearedAt = DateTime.UtcNow
            });
        }

        public class ExportRequest
        {
            public string ReportType { get; set; } = string.Empty; // e.g. "Orders", "Catalog"
            public string Format { get; set; } = "CSV"; // CSV, PDF, Excel
            public string TimeFilter { get; set; } = "allTime"; // allTime, last7days, last30days, thisYear
        }

        public class ReportSettingsUpdate
        {
            public int LowStockAlertLimit { get; set; } = 10;
            public string DefaultCurrency { get; set; } = "INR";
        }
    }
}
