using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShyamAgroSuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSmsVerifiedToManualPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add UTR bank-verification tracking columns to ManualPayments.
            // DisplayOrder / Banners were already applied to production in an earlier
            // deployment, so only the two new columns are added here.
            migrationBuilder.AddColumn<bool>(
                name: "SmsVerified",
                table: "ManualPayments",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "VerifiedUtr",
                table: "ManualPayments",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SmsVerified",
                table: "ManualPayments");

            migrationBuilder.DropColumn(
                name: "VerifiedUtr",
                table: "ManualPayments");
        }
    }
}
