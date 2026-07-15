using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ShyamAgroSuite.Api.Models
{
    [Table("ReturnRequests")]
    public class ReturnRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string RequestNumber { get; set; } = string.Empty; // e.g. RET-20260712-00014 or RPL-20260712-00015

        [Required]
        public int CustomerId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int OrderItemId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        public string RequestType { get; set; } = string.Empty; // RETURN_REFUND, REPLACEMENT_EXCHANGE

        [Required]
        public string ReasonCode { get; set; } = string.Empty; // PRODUCT_DAMAGED, etc.

        public string ReasonText { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int PurchasedQuantity { get; set; }
        public int RequestedQuantity { get; set; }

        public string? RefundMethod { get; set; } // ORIGINAL_PAYMENT_METHOD, SAT_WALLET

        public decimal? EstimatedRefundAmount { get; set; }
        public decimal? ApprovedRefundAmount { get; set; }

        public int PickupAddressId { get; set; }
        public string PickupName { get; set; } = string.Empty;
        public string PickupPhone { get; set; } = string.Empty;
        public string PickupAddress { get; set; } = string.Empty;
        public string PickupPincode { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = "REQUEST_SUBMITTED"; // REQUEST_SUBMITTED, UNDER_REVIEW, etc.

        public string? RejectionReason { get; set; }

        // Product snap
        public string ProductNameSnapshot { get; set; } = string.Empty;
        public string ProductCodeSnapshot { get; set; } = string.Empty;
        public string ProductImageUrlSnapshot { get; set; } = string.Empty;
        public decimal UnitPriceSnapshot { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public List<ReturnEvidence> Evidence { get; set; } = new();
        public List<ReturnTimeline> Timeline { get; set; } = new();
        public ReturnPickup? Pickup { get; set; }

        // Replacement specific fields
        public int? ReplacementOrderId { get; set; }
        public string? ReplacementOrderNumber { get; set; }
        public string? ReplacementTrackingNumber { get; set; }
        public string? ReplacementCarrierName { get; set; }
        public DateTime? ReplacementEstimatedDeliveryDate { get; set; }
    }

    [Table("ReturnEvidences")]
    public class ReturnEvidence
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ReturnRequestId { get; set; }

        [JsonIgnore]
        public ReturnRequest? ReturnRequest { get; set; }

        [Required]
        public string FileName { get; set; } = string.Empty;

        [Required]
        public string FileUrl { get; set; } = string.Empty;

        [Required]
        public string ContentType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("ReturnTimelines")]
    public class ReturnTimeline
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ReturnRequestId { get; set; }

        [JsonIgnore]
        public ReturnRequest? ReturnRequest { get; set; }

        [Required]
        public string Status { get; set; } = string.Empty;

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public string? Remarks { get; set; }

        public DateTime? EventDate { get; set; }

        public int? UpdatedByUserId { get; set; }
        public string UpdatedByRole { get; set; } = "System"; // Customer, Admin, System

        public bool IsCustomerVisible { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("ReturnPickups")]
    public class ReturnPickup
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ReturnRequestId { get; set; }

        [JsonIgnore]
        public ReturnRequest? ReturnRequest { get; set; }

        public DateTime? PickupDate { get; set; }
        public string? PickupAgentName { get; set; }
        public string? PickupAgentPhone { get; set; }
        public string? PickupTrackingNumber { get; set; }
        public string? Remarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
