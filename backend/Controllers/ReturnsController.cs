using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReturnsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ReturnsController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // Resolves the logged-in Customer using JWT Identity Name, Custom headers or Query fallback
        private async Task<Customer?> GetLoggedInCustomerAsync()
        {
            var identifier = "";
            if (User?.Identity?.IsAuthenticated == true && !string.IsNullOrEmpty(User.Identity.Name))
            {
                identifier = User.Identity.Name;
            }
            else
            {
                var keys = new[] { "email", "useremail", "user-email", "x-email", "x-user-email", "mobile", "mobilenumber", "phone" };
                foreach (var key in keys)
                {
                    var headerVal = Request.Headers.FirstOrDefault(h => h.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                    if (!string.IsNullOrEmpty(headerVal))
                    {
                        identifier = headerVal.ToString();
                        break;
                    }
                }

                if (string.IsNullOrEmpty(identifier))
                {
                    var qKeys = new[] { "email", "useremail", "mobile", "mobilenumber", "phone" };
                    foreach (var key in qKeys)
                    {
                        var queryVal = Request.Query.FirstOrDefault(q => q.Key.Equals(key, StringComparison.OrdinalIgnoreCase)).Value;
                        if (!string.IsNullOrEmpty(queryVal))
                        {
                            identifier = queryVal.ToString();
                            break;
                        }
                    }
                }
            }

            if (string.IsNullOrEmpty(identifier))
            {
                return await _context.Customers.Include(c => c.User).FirstOrDefaultAsync();
            }

            var customer = await _context.Customers
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Email.ToLower() == identifier.ToLower() || c.Phone == identifier);

            if (customer == null)
            {
                var grower = await _context.GrowerUsers.FirstOrDefaultAsync(u => u.Phone == identifier);
                if (grower != null)
                {
                    customer = await _context.Customers
                        .Include(c => c.User)
                        .FirstOrDefaultAsync(c => c.UserId == grower.Id);
                }
            }

            if (customer == null && int.TryParse(identifier, out int custId))
            {
                customer = await _context.Customers
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.Id == custId);
            }

            return customer ?? await _context.Customers.Include(c => c.User).FirstOrDefaultAsync();
        }

        // 1. GET: api/Returns/config
        [HttpGet("config")]
        public async Task<IActionResult> GetConfig()
        {
            var systemSetting = await _context.SystemSettings.FirstOrDefaultAsync();
            int returnWindowDays = 7; // Default fallback

            var requestTypes = new[]
            {
                new { code = "RETURN_REFUND", title = "Return / Refund", description = "Return the product and request a refund." },
                new { code = "REPLACEMENT_EXCHANGE", title = "Replacement / Exchange", description = "Replace or exchange the product." }
            };

            var reasons = new[]
            {
                new { code = "PRODUCT_DAMAGED", title = "Product arrived damaged", descriptionRequired = false },
                new { code = "WRONG_PRODUCT", title = "Wrong product received", descriptionRequired = false },
                new { code = "PRODUCT_NOT_WORKING", title = "Product is not working", descriptionRequired = false },
                new { code = "MISSING_PARTS", title = "Missing parts or accessories", descriptionRequired = false },
                new { code = "NOT_AS_DESCRIBED", title = "Product is different from description", descriptionRequired = false },
                new { code = "QUALITY_ISSUE", title = "Quality issue", descriptionRequired = false },
                new { code = "OTHER", title = "Other", descriptionRequired = true }
            };

            var refundMethods = new[]
            {
                new { code = "ORIGINAL_PAYMENT_METHOD", title = "Original Payment Method" },
                new { code = "SAT_WALLET", title = "SAT Wallet" }
            };

            return Ok(new
            {
                success = true,
                requestTypes,
                reasons,
                refundMethods,
                maximumEvidenceFiles = 4,
                maximumDescriptionLength = 600,
                maximumFileSizeMb = 5,
                allowedFileTypes = new[] { "image/jpeg", "image/png", "image/webp" },
                returnWindowDays = returnWindowDays
            });
        }

        // 2. GET: api/Returns/eligibility/order-item/{orderItemId}
        [HttpGet("eligibility/order-item/{orderItemId}")]
        public async Task<IActionResult> GetEligibility(int orderItemId)
        {
            var customer = await GetLoggedInCustomerAsync();
            if (customer == null)
            {
                return Unauthorized(new { success = false, message = "User not authenticated." });
            }

            var orderItem = await _context.Set<OrderItem>()
                .Include(oi => oi.Order)
                .FirstOrDefaultAsync(oi => oi.Id == orderItemId);

            if (orderItem == null)
            {
                return NotFound(new { success = false, message = "Order item not found." });
            }

            // Verify owner
            if (orderItem.Order?.CustomerId != customer.Id)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = "You are not authorized to access this order item." });
            }

            // Check if request already exists
            var existingRequest = await _context.ReturnRequests
                .FirstOrDefaultAsync(r => r.OrderItemId == orderItemId);

            if (existingRequest != null)
            {
                return Ok(new
                {
                    success = true,
                    eligible = false,
                    canSubmit = false,
                    existingRequestId = existingRequest.Id,
                    existingRequestNumber = existingRequest.RequestNumber,
                    existingRequestStatus = existingRequest.Status,
                    message = "A request already exists for this order item."
                });
            }

            // Verify Delivered status
            var order = orderItem.Order!;
            bool isDelivered = order.Status.Equals("Delivered", StringComparison.OrdinalIgnoreCase) || 
                               order.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase);

            if (!isDelivered)
            {
                return Ok(new
                {
                    success = true,
                    eligible = false,
                    canSubmit = false,
                    reasonCode = "ORDER_NOT_DELIVERED",
                    message = "The parent order must be delivered to raise a request."
                });
            }

            // Resolve delivered date & window ending
            var deliveredLog = await _context.OrderTrackingLogs
                .FirstOrDefaultAsync(l => l.OrderId == order.Id && l.Status.ToLower() == "delivered");
            var deliveredDate = deliveredLog?.CreatedAt ?? order.OrderDate.AddDays(2);
            var returnWindowEndsAt = deliveredDate.AddDays(7); // 7 days return window

            if (DateTime.UtcNow > returnWindowEndsAt)
            {
                return Ok(new
                {
                    success = true,
                    eligible = false,
                    canSubmit = false,
                    reasonCode = "RETURN_WINDOW_EXPIRED",
                    message = "The return window for this item has expired."
                });
            }

            return Ok(new
            {
                success = true,
                eligible = true,
                canSubmit = true,
                orderId = order.Id,
                orderItemId = orderItem.Id,
                productId = orderItem.ProductId,
                orderStatus = order.Status,
                deliveredDate = deliveredDate.ToString("yyyy-MM-ddTHH:mm:ss"),
                returnWindowEndsAt = returnWindowEndsAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                maximumRequestQuantity = orderItem.Quantity,
                allowedRequestTypes = new[] { "RETURN_REFUND", "REPLACEMENT_EXCHANGE" },
                allowedRefundMethods = new[] { "ORIGINAL_PAYMENT_METHOD", "SAT_WALLET" },
                existingRequestId = (int?)null,
                message = "This item is eligible for return or replacement."
            });
        }

        // 3. POST: api/Returns
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubmitReturn([FromForm] ReturnSubmissionDto submission)
        {
            var customer = await GetLoggedInCustomerAsync();
            if (customer == null)
            {
                return Unauthorized(new { success = false, message = "User not authenticated." });
            }

            var orderItem = await _context.Set<OrderItem>()
                .Include(oi => oi.Order)
                .FirstOrDefaultAsync(oi => oi.Id == submission.OrderItemId);

            if (orderItem == null)
            {
                return NotFound(new { success = false, message = "Order item not found." });
            }

            // Validation checks
            if (orderItem.Order?.CustomerId != customer.Id)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = "You are not authorized to access this order item." });
            }

            var existingRequest = await _context.ReturnRequests
                .FirstOrDefaultAsync(r => r.OrderItemId == submission.OrderItemId);
            if (existingRequest != null)
            {
                return StatusCode(StatusCodes.Status409Conflict, new
                {
                    success = false,
                    message = "A return or replacement request already exists for this order item.",
                    existingRequestId = existingRequest.Id,
                    existingRequestNumber = existingRequest.RequestNumber
                });
            }

            if (submission.RequestedQuantity <= 0 || submission.RequestedQuantity > orderItem.Quantity)
            {
                return BadRequest(new { success = false, message = $"RequestedQuantity must be between 1 and purchased quantity ({orderItem.Quantity})." });
            }

            if (submission.ReasonCode.Equals("OTHER", StringComparison.OrdinalIgnoreCase) && string.IsNullOrEmpty(submission.Description))
            {
                return BadRequest(new { success = false, message = "Description is required when reason is OTHER." });
            }

            if (submission.RequestType.Equals("RETURN_REFUND", StringComparison.OrdinalIgnoreCase) && string.IsNullOrEmpty(submission.RefundMethod))
            {
                return BadRequest(new { success = false, message = "RefundMethod is required for return refunds." });
            }

            // Resolve pickup address
            var address = await _context.Set<CustomerAddress>()
                .FirstOrDefaultAsync(a => a.AddressId == submission.PickupAddressId);

            string pickupName = address != null ? $"{address.FirstName} {address.LastName}".Trim() : customer.Name;
            string pickupPhone = address != null ? address.PhoneNumber : customer.Phone;
            
            string fallbackAddress = (orderItem.Order != null && !string.IsNullOrEmpty(orderItem.Order.ShippingAddress))
                ? orderItem.Order.ShippingAddress
                : customer.Address;
            string pickupAddress = address != null ? address.FullAddress : fallbackAddress;
            
            string pickupPincode = "";
            if (address != null)
            {
                pickupPincode = address.Pincode;
            }
            else if (!string.IsNullOrEmpty(pickupAddress))
            {
                var match = System.Text.RegularExpressions.Regex.Match(pickupAddress, @"\b\d{6}\b");
                if (match.Success)
                {
                    pickupPincode = match.Value;
                }
            }

            // Product snapshot resolver
            var product = await _context.Products.FindAsync(orderItem.ProductId);
            string productName = product?.ProductName ?? orderItem.ProductName;
            string productCode = product?.SKU ?? orderItem.ProductCode;
            string productImageUrl = orderItem.ImageUrl; 
            if (string.IsNullOrEmpty(productImageUrl) && product != null)
            {
                var mainImg = await _context.Set<ProductImage>().FirstOrDefaultAsync(pi => pi.ProductId == product.Id);
                productImageUrl = mainImg?.ImageUrl ?? "/uploads/images/product.png";
            }

            // Estimated refund
            decimal? estimatedRefund = null;
            if (submission.RequestType.Equals("RETURN_REFUND", StringComparison.OrdinalIgnoreCase))
            {
                estimatedRefund = orderItem.Price * submission.RequestedQuantity;
            }

            // Generate Request Number
            var prefix = submission.RequestType.Equals("RETURN_REFUND", StringComparison.OrdinalIgnoreCase) ? "RET" : "RPL";
            var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
            var totalCount = await _context.ReturnRequests.CountAsync();
            var requestNumber = $"{prefix}-{datePart}-{(totalCount + 1):D5}";

            // Create return request entry
            var returnRequest = new ReturnRequest
            {
                RequestNumber = requestNumber,
                CustomerId = customer.Id,
                OrderId = submission.OrderId,
                OrderItemId = submission.OrderItemId,
                ProductId = orderItem.ProductId,
                RequestType = submission.RequestType,
                ReasonCode = submission.ReasonCode,
                ReasonText = GetReasonTitle(submission.ReasonCode),
                Description = submission.Description ?? "",
                PurchasedQuantity = orderItem.Quantity,
                RequestedQuantity = submission.RequestedQuantity,
                RefundMethod = submission.RefundMethod,
                EstimatedRefundAmount = estimatedRefund,
                PickupAddressId = submission.PickupAddressId,
                PickupName = pickupName,
                PickupPhone = pickupPhone,
                PickupAddress = pickupAddress,
                PickupPincode = pickupPincode,
                Status = "REQUEST_SUBMITTED",
                ProductNameSnapshot = productName,
                ProductCodeSnapshot = productCode,
                ProductImageUrlSnapshot = productImageUrl,
                UnitPriceSnapshot = orderItem.Price,
                SubmittedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ReturnRequests.Add(returnRequest);
            await _context.SaveChangesAsync();

            // Process Evidence Uploads
            if (submission.EvidenceFiles != null && submission.EvidenceFiles.Count > 0)
            {
                var returnFiles = submission.EvidenceFiles.Take(4).ToList();
                var uploadsDir = Path.Combine(_environment.WebRootPath ?? Directory.GetCurrentDirectory(), "uploads", "returns");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                foreach (var file in returnFiles)
                {
                    if (file.Length > 0)
                    {
                        var ext = Path.GetExtension(file.FileName);
                        var uniqueFileName = $"{Guid.NewGuid()}{ext}";
                        var path = Path.Combine(uploadsDir, uniqueFileName);

                        using (var stream = new FileStream(path, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        var fileUrl = $"/uploads/returns/{uniqueFileName}";
                        // Absolute URL conversion if Request context is present
                        if (Request != null)
                        {
                            fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/returns/{uniqueFileName}";
                        }

                        var evidence = new ReturnEvidence
                        {
                            ReturnRequestId = returnRequest.Id,
                            FileName = file.FileName,
                            FileUrl = fileUrl,
                            ContentType = file.ContentType,
                            FileSize = file.Length,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.ReturnEvidences.Add(evidence);
                    }
                }
                await _context.SaveChangesAsync();
            }

            // Create initial timeline logs
            var trackingSubmittedTimeline = new ReturnTimeline
            {
                ReturnRequestId = returnRequest.Id,
                Status = "REQUEST_SUBMITTED",
                Title = "Request Submitted",
                Description = submission.RequestType.Equals("RETURN_REFUND", StringComparison.OrdinalIgnoreCase) 
                    ? "Your return and refund request has been submitted." 
                    : "Your replacement and exchange request has been submitted.",
                EventDate = DateTime.UtcNow,
                UpdatedByRole = "Customer",
                IsCustomerVisible = true,
                CreatedAt = DateTime.UtcNow
            };
            
            var trackingReviewTimeline = new ReturnTimeline
            {
                ReturnRequestId = returnRequest.Id,
                Status = "UNDER_REVIEW",
                Title = "Request Under Review",
                Description = "Our team will review your request.",
                EventDate = null,
                UpdatedByRole = "System",
                IsCustomerVisible = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ReturnTimelines.AddRange(trackingSubmittedTimeline, trackingReviewTimeline);

            // Trigger Notification to Admin
            var adminNotification = new Notification
            {
                Title = "New Return/Replacement Request",
                Message = $"Request {requestNumber} submitted by Customer {customer.Name} for order {orderItem.Order?.OrderNumber}.",
                Type = "ReturnRequest",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(adminNotification);

            await _context.SaveChangesAsync();

            // Return full detail payload
            return await GetReturnDetailsResponse(returnRequest.Id);
        }

        // 5. GET: api/Returns/my
        [HttpGet("my")]
        public async Task<IActionResult> GetMyReturns(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] string? requestType = null)
        {
            var customer = await GetLoggedInCustomerAsync();
            if (customer == null)
            {
                return Unauthorized(new { success = false, message = "User not authenticated." });
            }

            var query = _context.ReturnRequests
                .Where(r => r.CustomerId == customer.Id)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            if (!string.IsNullOrEmpty(requestType))
            {
                query = query.Where(r => r.RequestType == requestType);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.SubmittedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var formatted = items.Select(r => new
            {
                r.Id,
                requestNumber = r.RequestNumber,
                orderId = r.OrderId,
                orderNumber = _context.Orders.FirstOrDefault(o => o.Id == r.OrderId)?.OrderNumber ?? "",
                orderItemId = r.OrderItemId,
                productId = r.ProductId,
                productName = r.ProductNameSnapshot,
                productImageUrl = r.ProductImageUrlSnapshot,
                requestType = r.RequestType,
                requestTypeLabel = r.RequestType == "RETURN_REFUND" ? "Return / Refund" : "Replacement / Exchange",
                status = r.Status,
                statusLabel = GetStageTitle(r.Status),
                submittedAt = r.SubmittedAt.ToString("yyyy-MM-ddTHH:mm:ss")
            }).ToList();

            return Ok(new
            {
                success = true,
                page,
                pageSize,
                totalCount,
                items = formatted
            });
        }

        // 6. GET: api/Returns/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var customer = await GetLoggedInCustomerAsync();
            if (customer == null)
            {
                return Unauthorized(new { success = false, message = "User not authenticated." });
            }

            var returnRequest = await _context.ReturnRequests.FindAsync(id);
            if (returnRequest == null)
            {
                return NotFound(new { success = false, message = "Return request not found." });
            }

            if (returnRequest.CustomerId != customer.Id)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = "You are not authorized to view this return request." });
            }

            return await GetReturnDetailsResponse(id);
        }

        // 7. GET: api/Returns/order/{orderId}
        [HttpGet("order/{orderId}")]
        public async Task<IActionResult> GetByOrder(int orderId)
        {
            var customer = await GetLoggedInCustomerAsync();
            if (customer == null)
            {
                return Unauthorized(new { success = false, message = "User not authenticated." });
            }

            var items = await _context.ReturnRequests
                .Where(r => r.CustomerId == customer.Id && r.OrderId == orderId)
                .OrderByDescending(r => r.SubmittedAt)
                .Select(r => new
                {
                    r.Id,
                    orderItemId = r.OrderItemId,
                    productId = r.ProductId,
                    requestNumber = r.RequestNumber,
                    requestType = r.RequestType,
                    status = r.Status
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                orderId = orderId,
                items = items
            });
        }

        // 8. GET: api/Returns/order-item/{orderItemId}
        [HttpGet("order-item/{orderItemId}")]
        public async Task<IActionResult> GetByOrderItem(int orderItemId)
        {
            var customer = await GetLoggedInCustomerAsync();
            if (customer == null)
            {
                return Unauthorized(new { success = false, message = "User not authenticated." });
            }

            var request = await _context.ReturnRequests
                .FirstOrDefaultAsync(r => r.CustomerId == customer.Id && r.OrderItemId == orderItemId);

            if (request == null)
            {
                return Ok(new { success = true, hasRequest = false, request = (object?)null });
            }

            return Ok(new
            {
                success = true,
                hasRequest = true,
                request = new
                {
                    id = request.Id,
                    requestNumber = request.RequestNumber,
                    status = request.Status
                }
            });
        }

        // Response payload helper format matching design mocks
        private async Task<IActionResult> GetReturnDetailsResponse(int id)
        {
            var request = await _context.ReturnRequests
                .Include(r => r.Evidence)
                .Include(r => r.Timeline)
                .Include(r => r.Pickup)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return NotFound();

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == request.OrderId);
            var evidenceList = request.Evidence.Select(e => new
            {
                e.Id,
                fileName = e.FileName,
                fileUrl = e.FileUrl,
                contentType = e.ContentType
            }).ToList();

            var pickupAddress = new
            {
                addressId = request.PickupAddressId,
                fullName = request.PickupName,
                phoneNumber = request.PickupPhone,
                addressLine1 = request.PickupAddress,
                addressLine2 = "",
                city = "", 
                district = "",
                state = "",
                pincode = request.PickupPincode,
                fullAddress = $"{request.PickupAddress}, {request.PickupPincode}".Trim(',', ' ')
            };

            var timelineList = GetTimelineStages(request, request.Timeline);

            return Ok(new
            {
                success = true,
                message = "Request loaded successfully.",
                request = new
                {
                    request.Id,
                    requestNumber = request.RequestNumber,
                    orderId = request.OrderId,
                    orderNumber = order?.OrderNumber ?? "",
                    orderItemId = request.OrderItemId,
                    productId = request.ProductId,
                    product = new
                    {
                        productName = request.ProductNameSnapshot,
                        productCode = request.ProductCodeSnapshot,
                        imageUrl = request.ProductImageUrlSnapshot,
                        unitPrice = request.UnitPriceSnapshot,
                        purchasedQuantity = request.PurchasedQuantity
                    },
                    requestedQuantity = request.RequestedQuantity,
                    requestType = request.RequestType,
                    requestTypeLabel = request.RequestType == "RETURN_REFUND" ? "Return / Refund" : "Replacement / Exchange",
                    reasonCode = request.ReasonCode,
                    reason = request.ReasonText,
                    description = request.Description,
                    refundMethod = request.RefundMethod,
                    refundMethodLabel = request.RefundMethod == "ORIGINAL_PAYMENT_METHOD" ? "Original Payment Method" : (request.RefundMethod == "SAT_WALLET" ? "SAT Wallet" : ""),
                    status = request.Status,
                    statusLabel = GetStageTitle(request.Status),
                    pickupAddress = pickupAddress,
                    evidence = evidenceList,
                    submittedAt = request.SubmittedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                    updatedAt = request.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                    canEdit = false,
                    canCancel = false,
                    timeline = timelineList,
                    estimatedRefundAmount = request.EstimatedRefundAmount,
                    approvedRefundAmount = request.ApprovedRefundAmount,
                    
                    // Replacement properties
                    replacementOrderId = request.ReplacementOrderId,
                    replacementOrderNumber = request.ReplacementOrderNumber,
                    replacementTrackingNumber = request.ReplacementTrackingNumber,
                    replacementCarrierName = request.ReplacementCarrierName,
                    replacementEstimatedDeliveryDate = request.ReplacementEstimatedDeliveryDate?.ToString("yyyy-MM-ddTHH:mm:ss")
                }
            });
        }

        private List<object> GetTimelineStages(ReturnRequest request, List<ReturnTimeline> dbTimeline)
        {
            var stages = new List<string>();
            if (request.RequestType == "RETURN_REFUND")
            {
                stages.AddRange(new[] {
                    "REQUEST_SUBMITTED", "UNDER_REVIEW", "PICKUP_SCHEDULED",
                    "PRODUCT_PICKED_UP", "QUALITY_CHECK", "REFUND_INITIATED", "REFUND_COMPLETED"
                });
            }
            else
            {
                stages.AddRange(new[] {
                    "REQUEST_SUBMITTED", "UNDER_REVIEW", "PICKUP_SCHEDULED",
                    "PRODUCT_PICKED_UP", "REPLACEMENT_APPROVED", "REPLACEMENT_SHIPPED", "REPLACEMENT_DELIVERED"
                });
            }

            if (request.Status == "REJECTED" && !stages.Contains("REJECTED"))
            {
                stages.Add("REJECTED");
            }

            var result = new List<object>();
            for (int i = 0; i < stages.Count; i++)
            {
                var stage = stages[i];
                var dbLog = dbTimeline.FirstOrDefault(l => l.Status == stage);
                
                var title = GetStageTitle(stage);
                var desc = GetStageDescription(stage, request);
                var eventDate = dbLog?.EventDate;
                var isCompleted = dbLog != null;
                var isCurrent = stage == request.Status;

                if (stage == "REJECTED")
                {
                    title = "Request Rejected";
                    desc = request.RejectionReason ?? "Your request has been rejected.";
                }

                result.Add(new
                {
                    status = stage,
                    title = title,
                    description = desc,
                    eventDate = eventDate != null ? eventDate.Value.ToString("yyyy-MM-ddTHH:mm:ss") : null,
                    isCompleted = isCompleted,
                    isCurrent = isCurrent
                });
            }

            return result;
        }

        private string GetStageTitle(string status)
        {
            return status switch
            {
                "REQUEST_SUBMITTED" => "Request Submitted",
                "UNDER_REVIEW" => "Request Under Review",
                "PICKUP_SCHEDULED" => "Pickup Scheduled",
                "PRODUCT_PICKED_UP" => "Product Picked Up",
                "QUALITY_CHECK" => "Quality Check",
                "REFUND_INITIATED" => "Refund Initiated",
                "REFUND_COMPLETED" => "Refund Completed",
                "REPLACEMENT_APPROVED" => "Replacement Approved",
                "REPLACEMENT_SHIPPED" => "Replacement Shipped",
                "REPLACEMENT_DELIVERED" => "Replacement Delivered",
                "REJECTED" => "Request Rejected",
                _ => status
            };
        }

        private string GetStageDescription(string status, ReturnRequest request)
        {
            return status switch
            {
                "REQUEST_SUBMITTED" => "Your request has been submitted.",
                "UNDER_REVIEW" => "Our team will review your request.",
                "PICKUP_SCHEDULED" => "Pickup agent has been scheduled.",
                "PRODUCT_PICKED_UP" => "The product has been collected.",
                "QUALITY_CHECK" => "The returned product is being inspected.",
                "REFUND_INITIATED" => "Your refund has been initiated.",
                "REFUND_COMPLETED" => "The refund has been completed.",
                "REPLACEMENT_APPROVED" => "Replacement item has been approved.",
                "REPLACEMENT_SHIPPED" => "Replacement item has been shipped.",
                "REPLACEMENT_DELIVERED" => "Replacement item has been delivered.",
                "REJECTED" => request.RejectionReason ?? "Your request has been rejected.",
                _ => ""
            };
        }

        private string GetReasonTitle(string reasonCode)
        {
            return reasonCode switch
            {
                "PRODUCT_DAMAGED" => "Product arrived damaged",
                "WRONG_PRODUCT" => "Wrong product received",
                "PRODUCT_NOT_WORKING" => "Product is not working",
                "MISSING_PARTS" => "Missing parts or accessories",
                "NOT_AS_DESCRIBED" => "Product is different from description",
                "QUALITY_ISSUE" => "Quality issue",
                "OTHER" => "Other",
                _ => reasonCode
            };
        }

        public class ReturnSubmissionDto
        {
            public int OrderId { get; set; }
            public int OrderItemId { get; set; }
            public string RequestType { get; set; } = string.Empty;
            public string ReasonCode { get; set; } = string.Empty;
            public string? Description { get; set; }
            public int RequestedQuantity { get; set; }
            public string? RefundMethod { get; set; }
            public int PickupAddressId { get; set; }
            public List<IFormFile>? EvidenceFiles { get; set; }
        }
    }
}
