namespace ShyamAgroSuite.Api.DTOs
{
    public class OrderSuccessDto
    {
        public int CustomerAddressId { get; set; }
        public int AddressId
        {
            get => CustomerAddressId;
            set => CustomerAddressId = value;
        }
        public string PaymentMethod { get; set; }
        public string? CouponCode { get; set; }
        public int? CoinsRedeemed { get; set; }

        // --- Payment Details ---
        public string? UpiId { get; set; }
        public string? CardNumber { get; set; }
        public string? NameOnCard { get; set; }
        public string? ExpiryDate { get; set; }
        public string? Cvv { get; set; }
        public string? BankName { get; set; }
        public string? TransactionId { get; set; }
        public string? PaymentStatus { get; set; }
    }
}