using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShyamAgroSuite.Api.Migrations
{
    /// <inheritdoc />
    public partial class MapToUserLogin1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // UserLogin1 table already exists in the remote database with all required columns.
            // This migration just updates the EF model snapshot to reflect the correct mapping.
            // No database changes needed.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op: reversing this migration would require manual DB changes.
        }
    }
}
