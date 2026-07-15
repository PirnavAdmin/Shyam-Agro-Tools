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
    public class InvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InvoicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Invoices?search=
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search)
        {
            var query = _context.Orders
                .Include(o => o.Customer)
                .AsQueryable();

            // Calculate metrics across all orders in database
            var allOrders = await _context.Orders.ToListAsync();
            var totalRevenue = allOrders
                .Where(o => o.Status != "Cancelled" && (o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase)))
                .Sum(o => o.FinalAmount);

            var paidCount = allOrders.Count(o => o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase));
            var unpaidCount = allOrders.Count(o => o.Status != "Cancelled" && !o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) && !o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) && !o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase));
            var cancelledCount = allOrders.Count(o => o.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase));

            // Apply search keywords (Invoice ID, Client Name, Email)
            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(o => 
                    o.OrderNumber.ToLower().Contains(s) || 
                    (o.Customer != null && o.Customer.Name.ToLower().Contains(s)) ||
                    (o.Customer != null && o.Customer.Email.ToLower().Contains(s))
                );
            }

            var ordersList = await query.OrderByDescending(o => o.OrderDate).ToListAsync();

            // Format entries into Invoice models
            var formattedInvoices = ordersList.Select(o => {
                var cleanOrderNum = o.OrderNumber.Replace("#", "").Trim();
                var invoiceId = cleanOrderNum.StartsWith("ORD-") 
                    ? cleanOrderNum.Replace("ORD-", "INV-") 
                    : $"INV-{cleanOrderNum}";

                var displayStatus = "Unpaid";
                if (o.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    displayStatus = "Cancelled";
                }
                else if (o.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || o.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase))
                {
                    displayStatus = "Paid";
                }

                return new
                {
                    o.Id,
                    InvoiceId = invoiceId,
                    Client = o.Customer?.Name ?? "Walk-in Customer",
                    Email = o.Customer?.Email ?? "N/A",
                    Date = o.OrderDate.ToString("yyyy-MM-dd"),
                    Billed = $"Rs. {o.FinalAmount:N0}",
                    Status = displayStatus
                };
            }).ToList();

            return Ok(new
            {
                TotalRevenue = $"Rs. {totalRevenue:N0}",
                PaidInvoices = paidCount,
                UnpaidInvoices = unpaidCount,
                CancelledInvoices = cancelledCount,
                Invoices = formattedInvoices
            });
        }

        // GET: api/Invoices/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { Message = "Invoice/Order not found." });
            }

            var cleanOrderNum = order.OrderNumber.Replace("#", "").Trim();
            var invoiceId = cleanOrderNum.StartsWith("ORD-") 
                ? cleanOrderNum.Replace("ORD-", "INV-") 
                : $"INV-{cleanOrderNum}";

            var displayStatus = "Unpaid";
            if (order.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                displayStatus = "Cancelled";
            }
            else if (order.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase) || order.PaymentStatus.Equals("Success", StringComparison.OrdinalIgnoreCase) || order.PaymentStatus.Equals("Verified Paid", StringComparison.OrdinalIgnoreCase))
            {
                displayStatus = "Paid";
            }

            return Ok(new
            {
                Id = order.Id,
                InvoiceId = invoiceId,
                Client = order.Customer?.Name ?? "Walk-in Customer",
                Email = order.Customer?.Email ?? "N/A",
                Phone = order.Customer?.Phone ?? "",
                Date = order.OrderDate.ToString("yyyy-MM-dd"),
                Billed = $"Rs. {order.FinalAmount:N0}",
                Status = displayStatus,
                Items = order.Items.Select(i => new {
                    i.ProductName,
                    i.Quantity,
                    Price = $"Rs. {i.Price:N0}",
                    Total = $"Rs. {i.Subtotal:N0}"
                })
            });
        }

        // POST: api/Invoices
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] InvoiceCreateRequest request)
        {
            if (string.IsNullOrEmpty(request.ClientName))
            {
                return BadRequest(new { Message = "Client Name is required." });
            }

            // 1. Lookup or create customer by phone/email
            var contact = string.IsNullOrEmpty(request.ContactNo) ? Guid.NewGuid().ToString() : request.ContactNo;
            var email = string.IsNullOrEmpty(request.EmailAddress) ? Guid.NewGuid().ToString() : request.EmailAddress;
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Phone == request.ContactNo || c.Email == request.EmailAddress);
            if (customer == null)
            {
                customer = new Customer
                {
                    Name = request.ClientName,
                    Phone = request.ContactNo,
                    Email = request.EmailAddress,
                    Address = request.Address ?? string.Empty,
                    State = "",
                    District = "",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow,
                    CoinsBalance = 0
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();
            }

            // 2. Create Order as backing store for the invoice
            var statusStr = "Pending";
            var payStatusStr = "Pending";
            if (!string.IsNullOrEmpty(request.PaymentStatus))
            {
                if (request.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase))
                {
                    statusStr = "Processing";
                    payStatusStr = "Paid";
                }
                else if (request.PaymentStatus.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    statusStr = "Cancelled";
                    payStatusStr = "Failed";
                }
            }

            var invoiceNumClean = string.IsNullOrEmpty(request.InvoiceNo) 
                ? $"INV-{new Random().Next(100000, 999999)}"
                : request.InvoiceNo.Replace("#", "").Trim();

            // Map back to ORD number format or keep invoice number directly
            var orderNumber = invoiceNumClean.StartsWith("INV-") 
                ? invoiceNumClean.Replace("INV-", "ORD-") 
                : $"ORD-{invoiceNumClean}";

            var order = new Order
            {
                CustomerId = customer.Id,
                OrderNumber = orderNumber,
                OrderDate = request.Date ?? DateTime.UtcNow,
                TotalAmount = request.SubTotal,
                FinalAmount = request.TotalAmount,
                DiscountAmount = request.Discount,
                ShippingFee = request.ShippingCharge,
                GstAmount = request.TaxAmount,
                Status = statusStr,
                PaymentStatus = payStatusStr,
                PaymentMethod = request.PaymentMethod ?? "COD",
                ShippingAddress = request.ShippingAddress ?? request.Address ?? string.Empty,
                TrackingNumber = request.TaxNumber ?? string.Empty,
                PackerName = request.Notes
            };

            // Add placeholder order item to represent invoice charges
            var orderItem = new OrderItem
            {
                ProductId = 1,
                ProductName = "Manual Invoice Charges",
                ProductCode = "SERV-001",
                CategoryName = "Services",
                Price = request.SubTotal,
                Quantity = 1,
                Subtotal = request.SubTotal
            };
            order.Items = new List<OrderItem> { orderItem };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var invoiceId = $"INV-{order.OrderNumber.Replace("ORD-", "")}";

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new
            {
                Id = order.Id,
                InvoiceId = invoiceId,
                Client = customer.Name,
                Email = customer.Email,
                Date = order.OrderDate.ToString("yyyy-MM-dd"),
                Billed = $"Rs. {order.FinalAmount:N0}",
                Status = request.PaymentStatus ?? "Unpaid"
            });
        }

        // PUT: api/Invoices/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] InvoiceUpdateRequest request)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { Message = "Invoice/Order not found." });
            }

            if (!string.IsNullOrEmpty(request.Status))
            {
                if (request.Status.Equals("Paid", StringComparison.OrdinalIgnoreCase))
                {
                    order.PaymentStatus = "Paid";
                }
                else if (request.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    order.Status = "Cancelled";
                }
                else
                {
                    order.PaymentStatus = "Pending";
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Invoices/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { Message = "Invoice/Order not found." });
            }

            order.Status = "Cancelled";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        public class InvoiceCreateRequest
        {
            public string? InvoiceNo { get; set; }
            public DateTime? Date { get; set; }
            public string? PaymentStatus { get; set; } // Unpaid, Paid, Cancelled
            public string ClientName { get; set; } = string.Empty;
            public string EmailAddress { get; set; } = string.Empty;
            public string ContactNo { get; set; } = string.Empty;
            public string? Address { get; set; }
            public string? PostalCode { get; set; }
            public string? TaxNumber { get; set; }
            public string? BillingName { get; set; }
            public string? BillingAddress { get; set; }
            public string? BillingPhone { get; set; }
            public string? BillingTaxNumber { get; set; }
            public string? BillingEmail { get; set; }
            public string? ShippingName { get; set; }
            public string? ShippingAddress { get; set; }
            public string? ShippingPhone { get; set; }
            public string? ShippingTaxNumber { get; set; }
            public string? ShippingEmail { get; set; }
            public string? PaymentMethod { get; set; }
            public decimal SubTotal { get; set; }
            public decimal TaxAmount { get; set; }
            public decimal Discount { get; set; }
            public decimal ShippingCharge { get; set; }
            public decimal TotalAmount { get; set; }
            public string? Notes { get; set; }
        }

        public class InvoiceUpdateRequest
        {
            public string? Status { get; set; } // Paid, Unpaid, Cancelled
        }
    }
}
