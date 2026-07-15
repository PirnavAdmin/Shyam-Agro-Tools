using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShyamAgroSuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBlogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tables already exist in the remote database from previous deployments.
            // Using IF NOT EXISTS to safely skip creation if already present.
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `Blogs` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `Title` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Category` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `AuthorName` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `PublishDate` datetime(6) NOT NULL,
                    `CoverImage` longtext CHARACTER SET utf8mb4 NULL,
                    `Summary` longtext CHARACTER SET utf8mb4 NULL,
                    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `CreatedAt` datetime(6) NOT NULL,
                    `UpdatedAt` datetime(6) NOT NULL,
                    CONSTRAINT `PK_Blogs` PRIMARY KEY (`Id`)
                ) CHARACTER SET=utf8mb4;
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `TestUsers` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `MobileNumber` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `FullName` longtext CHARACTER SET utf8mb4 NULL,
                    `Email` longtext CHARACTER SET utf8mb4 NULL,
                    `ProfileImageUrl` longtext CHARACTER SET utf8mb4 NULL,
                    `DoorNo` longtext CHARACTER SET utf8mb4 NULL,
                    `StreetArea` longtext CHARACTER SET utf8mb4 NULL,
                    `City` longtext CHARACTER SET utf8mb4 NULL,
                    `State` longtext CHARACTER SET utf8mb4 NULL,
                    `Pincode` longtext CHARACTER SET utf8mb4 NULL,
                    `OTP` longtext CHARACTER SET utf8mb4 NULL,
                    `OTPGeneratedAt` datetime(6) NULL,
                    `CreatedDate` datetime(6) NOT NULL,
                    CONSTRAINT `PK_TestUsers` PRIMARY KEY (`Id`)
                ) CHARACTER SET=utf8mb4;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Blogs");

            migrationBuilder.DropTable(
                name: "TestUsers");
        }
    }
}
