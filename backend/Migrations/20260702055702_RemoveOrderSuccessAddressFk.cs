using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShyamAgroSuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOrderSuccessAddressFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE order_success DROP FOREIGN KEY order_success_ibfk_1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE order_success ADD CONSTRAINT order_success_ibfk_1 FOREIGN KEY (CustomerAddressId) REFERENCES CustomerAddresses (AddressId) ON DELETE RESTRICT;");
        }
    }
}
