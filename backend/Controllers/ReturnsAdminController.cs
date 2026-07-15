using System;
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
    public class ReturnsAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReturnsAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/ReturnsAdmin
        [HttpGet]
        [Route("admin")]
        public async Task<IActionResult> GetAdminList(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] string? requestType,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int? customerId,
            [FromQuery] string? orderNumber,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.ReturnRequests
                .Include(r => r.Evidence)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(r => 
                    r.RequestNumber.ToLower().Contains(s) || 
                    r.ProductNameSnapshot.ToLower().Contains(s) ||
                    r.PickupName.ToLower().Contains(s)
                );
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            if (!string.IsNullOrEmpty(requestType))
            {
                query = query.Where(r => r.RequestType == requestType);
            }

            if (dateFrom.HasValue)
            {
                query = query.Where(r => r.SubmittedAt >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                query = query.Where(r => r.SubmittedAt <= dateTo.Value);
            }

            if (customerId.HasValue)
            {
                query = query.Where(r => r.CustomerId == customerId.Value);
            }

            if (!string.IsNullOrEmpty(orderNumber))
            {
                var oNum = orderNumber.ToLower();
                var matchingOrderIds = await _context.Orders
                    .Where(o => o.OrderNumber.ToLower().Contains(oNum))
                    .Select(o => o.Id)
                    .ToListAsync();
                query = query.Where(r => matchingOrderIds.Contains(r.OrderId));
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
                customerId = r.CustomerId,
                customerName = r.PickupName,
                orderId = r.OrderId,
                orderNumber = _context.Orders.FirstOrDefault(o => o.Id == r.OrderId)?.OrderNumber ?? "",
                productId = r.ProductId,
                productName = r.ProductNameSnapshot,
                requestType = r.RequestType,
                requestTypeLabel = r.RequestType == "RETURN_REFUND" ? "Return / Refund" : "Replacement / Exchange",
                reasonCode = r.ReasonCode,
                reason = r.ReasonText,
                description = r.Description,
                requestedQuantity = r.RequestedQuantity,
                refundMethod = r.RefundMethod,
                pickupAddress = new
                {
                    r.PickupName,
                    r.PickupPhone,
                    r.PickupAddress,
                    r.PickupPincode
                },
                submittedAt = r.SubmittedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                status = r.Status,
                evidence = r.Evidence.Select(e => e.FileUrl).ToList()
            }).ToList();

            return Ok(new
            {
                success = true,
                totalCount,
                page,
                pageSize,
                items = formatted
            });
        }

        // 2. PUT: api/ReturnsAdmin/{id}/status
        [HttpPut]
        [Route("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateRequest request)
        {
            var returnRequest = await _context.ReturnRequests.FindAsync(id);
            if (returnRequest == null)
            {
                return NotFound(new { success = false, message = "Return request not found." });
            }

            // Transition guard checks
            if (returnRequest.Status == "REFUND_COMPLETED" || returnRequest.Status == "REPLACEMENT_DELIVERED" || returnRequest.Status == "REJECTED")
            {
                return BadRequest(new { success = false, message = $"Cannot modify status of a return request that is already in final state: {returnRequest.Status}." });
            }

            // Update status and add timeline log
            returnRequest.Status = request.Status;
            if (request.Status == "REJECTED")
            {
                returnRequest.RejectionReason = request.RejectionReason;
            }
            returnRequest.UpdatedAt = DateTime.UtcNow;

            var timeline = new ReturnTimeline
            {
                ReturnRequestId = returnRequest.Id,
                Status = request.Status,
                Title = request.Title ?? GetStageTitle(request.Status),
                Description = request.Description ?? GetStageDescription(request.Status, returnRequest.RejectionReason),
                Remarks = request.Remarks,
                EventDate = DateTime.UtcNow,
                UpdatedByRole = "Admin",
                IsCustomerVisible = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ReturnTimelines.Add(timeline);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Status updated successfully.", status = returnRequest.Status });
        }

        // 3. PUT: api/ReturnsAdmin/{id}/pickup
        [HttpPut]
        [Route("{id}/pickup")]
        public async Task<IActionResult> UpdatePickup(int id, [FromBody] PickupUpdateRequest request)
        {
            var returnRequest = await _context.ReturnRequests.FindAsync(id);
            if (returnRequest == null)
            {
                return NotFound(new { success = false, message = "Return request not found." });
            }

            var pickup = await _context.ReturnPickups.FirstOrDefaultAsync(p => p.ReturnRequestId == id);
            if (pickup == null)
            {
                pickup = new ReturnPickup { ReturnRequestId = id, CreatedAt = DateTime.UtcNow };
                _context.ReturnPickups.Add(pickup);
            }

            pickup.PickupDate = request.PickupDate;
            pickup.PickupAgentName = request.PickupAgentName;
            pickup.PickupAgentPhone = request.PickupAgentPhone;
            pickup.PickupTrackingNumber = request.PickupTrackingNumber;
            pickup.Remarks = request.Remarks;
            pickup.UpdatedAt = DateTime.UtcNow;

            // Automatically transition status to PICKUP_SCHEDULED if not already
            if (returnRequest.Status == "REQUEST_SUBMITTED" || returnRequest.Status == "UNDER_REVIEW")
            {
                returnRequest.Status = "PICKUP_SCHEDULED";
                returnRequest.UpdatedAt = DateTime.UtcNow;

                var timeline = new ReturnTimeline
                {
                    ReturnRequestId = returnRequest.Id,
                    Status = "PICKUP_SCHEDULED",
                    Title = "Pickup Scheduled",
                    Description = $"Pickup scheduled for {request.PickupDate:dd MMM yyyy}. Agent Name: {request.PickupAgentName}.",
                    Remarks = request.Remarks,
                    EventDate = DateTime.UtcNow,
                    UpdatedByRole = "Admin",
                    IsCustomerVisible = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ReturnTimelines.Add(timeline);
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Pickup details updated successfully.", pickup });
        }

        // 4. PUT: api/ReturnsAdmin/{id}/refund
        [HttpPut]
        [Route("{id}/refund")]
        public async Task<IActionResult> UpdateRefund(int id, [FromBody] RefundUpdateRequest request)
        {
            var returnRequest = await _context.ReturnRequests.FindAsync(id);
            if (returnRequest == null)
            {
                return NotFound(new { success = false, message = "Return request not found." });
            }

            returnRequest.ApprovedRefundAmount = request.ApprovedRefundAmount;
            returnRequest.RefundMethod = request.RefundMethod ?? returnRequest.RefundMethod;
            
            // Advance status if provided
            if (!string.IsNullOrEmpty(request.RefundStatus))
            {
                returnRequest.Status = request.RefundStatus;
                returnRequest.UpdatedAt = DateTime.UtcNow;

                var timeline = new ReturnTimeline
                {
                    ReturnRequestId = returnRequest.Id,
                    Status = request.RefundStatus,
                    Title = GetStageTitle(request.RefundStatus),
                    Description = request.Remarks ?? GetStageDescription(request.RefundStatus, null),
                    Remarks = request.Remarks,
                    EventDate = DateTime.UtcNow,
                    UpdatedByRole = "Admin",
                    IsCustomerVisible = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ReturnTimelines.Add(timeline);
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Refund details updated successfully.", approvedRefundAmount = returnRequest.ApprovedRefundAmount });
        }

        // 5. PUT: api/ReturnsAdmin/{id}/replacement
        [HttpPut]
        [Route("{id}/replacement")]
        public async Task<IActionResult> UpdateReplacement(int id, [FromBody] ReplacementUpdateRequest request)
        {
            var returnRequest = await _context.ReturnRequests.FindAsync(id);
            if (returnRequest == null)
            {
                return NotFound(new { success = false, message = "Return request not found." });
            }

            returnRequest.ReplacementOrderId = request.ReplacementOrderId;
            returnRequest.ReplacementOrderNumber = request.ReplacementOrderNumber;
            returnRequest.ReplacementTrackingNumber = request.TrackingNumber;
            returnRequest.ReplacementCarrierName = request.CarrierName;
            returnRequest.ReplacementEstimatedDeliveryDate = request.EstimatedDeliveryDate;

            if (!string.IsNullOrEmpty(request.ReplacementStatus))
            {
                returnRequest.Status = request.ReplacementStatus;
                returnRequest.UpdatedAt = DateTime.UtcNow;

                var timeline = new ReturnTimeline
                {
                    ReturnRequestId = returnRequest.Id,
                    Status = request.ReplacementStatus,
                    Title = GetStageTitle(request.ReplacementStatus),
                    Description = request.Remarks ?? GetStageDescription(request.ReplacementStatus, null),
                    Remarks = request.Remarks,
                    EventDate = DateTime.UtcNow,
                    UpdatedByRole = "Admin",
                    IsCustomerVisible = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ReturnTimelines.Add(timeline);
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Replacement details updated successfully.", returnRequest });
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

        private string GetStageDescription(string status, string? rejectionReason)
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
                "REJECTED" => rejectionReason ?? "Your request has been rejected.",
                _ => ""
            };
        }

        public class StatusUpdateRequest
        {
            public string Status { get; set; } = string.Empty;
            public string? Title { get; set; }
            public string? Description { get; set; }
            public string? Remarks { get; set; }
            public string? RejectionReason { get; set; }
        }

        public class PickupUpdateRequest
        {
            public DateTime PickupDate { get; set; }
            public string PickupAgentName { get; set; } = string.Empty;
            public string PickupAgentPhone { get; set; } = string.Empty;
            public string PickupTrackingNumber { get; set; } = string.Empty;
            public string? Remarks { get; set; }
        }

        public class RefundUpdateRequest
        {
            public decimal ApprovedRefundAmount { get; set; }
            public string? RefundMethod { get; set; }
            public string? RefundTransactionId { get; set; }
            public string? RefundStatus { get; set; }
            public string? Remarks { get; set; }
        }

        public class ReplacementUpdateRequest
        {
            public int ReplacementOrderId { get; set; }
            public string ReplacementOrderNumber { get; set; } = string.Empty;
            public string TrackingNumber { get; set; } = string.Empty;
            public string CarrierName { get; set; } = string.Empty;
            public string? ReplacementStatus { get; set; }
            public DateTime EstimatedDeliveryDate { get; set; }
            public string? Remarks { get; set; }
        }
    }
}
