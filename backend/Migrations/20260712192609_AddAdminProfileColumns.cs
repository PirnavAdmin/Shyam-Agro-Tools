using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShyamAgroSuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminProfileColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmployeeId",
                table: "admin_user",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "FullName",
                table: "admin_user",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MobileNumber",
                table: "admin_user",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "admin_user");

            migrationBuilder.DropColumn(
                name: "FullName",
                table: "admin_user");

            migrationBuilder.DropColumn(
                name: "MobileNumber",
                table: "admin_user");
        }
    }
}
