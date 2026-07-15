using System.ComponentModel.DataAnnotations;

namespace ShyamAgroSuite.Api.Models
{
    public class CustomerAddress
    {
        [Key]
        public int AddressId { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public string AlternatePhoneNumber { get; set; }

        public string FullAddress { get; set; }

        public string City { get; set; }

        public string State { get; set; }

        public string Pincode { get; set; }

        public string AddressType { get; set; }

        public DateTime CreatedDate { get; set; }
    }
}