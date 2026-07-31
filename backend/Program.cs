using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ShyamAgroSuite.Api.Data;
using ShyamAgroSuite.Api.Repositories;
using ShyamAgroSuite.Api.Repositories.Interfaces;
using ShyamAgroSuite.Api.Services;
using ShyamAgroSuite.Api.Services.Interfaces;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers & ignore JSON reference cycles
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "ShyamAgroSuite API", Version = "v1" });
    
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below. Example: 'Bearer 12345abcdef'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Database (Using hardcoded MySQL version to avoid extra startup connection quota consumption)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new MySqlServerVersion(new Version(10, 6, 0)),
        mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorNumbersToAdd: null);
        }));

// Repositories
builder.Services.AddScoped<ITestUserRepository, TestUserRepository>();
builder.Services.AddScoped<IBlogRepository, BlogRepository>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ITestAuthService, TestAuthService>();
builder.Services.AddScoped<IBlogService, BlogService>();
builder.Services.AddScoped<IProductService, ProductService>();

// JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? builder.Configuration["Jwt:SecretKey"] ?? "ShyamAgroToolsSecretKey_SuperSecureKey_2026_AGY_987654321";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ShyamAgroToolsApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ShyamAgroToolsApp";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,

            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// One-time cleanup: delete specific legacy supplier records by ID + fix NULL values
using (var cleanupScope = app.Services.CreateScope())
{
    var cleanupContext = cleanupScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        var conn = cleanupContext.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            conn.Open();

        // 1. Delete legacy records with IDs 1 and 3
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "DELETE FROM Suppliers WHERE Id IN (1, 3)";
            int deleted = cmd.ExecuteNonQuery();
            if (deleted > 0)
                Console.WriteLine($"[Startup] Removed {deleted} legacy supplier record(s).");
        }

        // 2. Fix NULL values - replace with safe defaults
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                UPDATE Suppliers SET
                    Gstin          = COALESCE(Gstin, ''),
                    ProductCategory = COALESCE(NULLIF(TRIM(ProductCategory), ''), 'General'),
                    TrackingId     = COALESCE(TrackingId, CONCAT('SEL', FLOOR(100000 + RAND() * 899999))),
                    City           = COALESCE(City, ''),
                    LeadTime       = COALESCE(NULLIF(TRIM(LeadTime), ''), '4-6 days'),
                    ProductLines   = COALESCE(ProductLines, ''),
                    CommercialTerms = COALESCE(NULLIF(TRIM(CommercialTerms), ''), 'Net 30')
                WHERE
                    Gstin IS NULL
                    OR ProductCategory IS NULL OR TRIM(ProductCategory) = ''
                    OR TrackingId IS NULL
                    OR City IS NULL
                    OR LeadTime IS NULL OR TRIM(LeadTime) = ''
                    OR ProductLines IS NULL
                    OR CommercialTerms IS NULL OR TRIM(CommercialTerms) = '';
            ";
            int fixed1 = cmd.ExecuteNonQuery();
            if (fixed1 > 0)
                Console.WriteLine($"[Startup] Fixed NULL values in {fixed1} Suppliers row(s).");
        }

        // 3. Fix PerformanceRating = 0 -> set to 4.5
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "UPDATE Suppliers SET PerformanceRating = 4.5 WHERE PerformanceRating <= 0 OR PerformanceRating IS NULL";
            int fixed2 = cmd.ExecuteNonQuery();
            if (fixed2 > 0)
                Console.WriteLine($"[Startup] Fixed PerformanceRating in {fixed2} Suppliers row(s).");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup] Supplier cleanup skipped: {ex.Message}");
    }
}

// Database Schema Initializer (Ensure WalletTransactions and expanded CoinsSettings exist)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        var conn = context.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
        {
            conn.Open();
        }

        // 1. Create WalletTransactions table
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `WalletTransactions` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `CustomerId` INT NOT NULL,
                    `Type` VARCHAR(50) NOT NULL,
                    `Source` VARCHAR(50) NOT NULL,
                    `Title` VARCHAR(150) NOT NULL,
                    `Description` TEXT NOT NULL,
                    `Coins` INT NOT NULL,
                    `OrderId` VARCHAR(100) NULL,
                    `CreatedDate` DATETIME NOT NULL,
                    `ExpiresAt` DATETIME NULL
                );";
            cmd.ExecuteNonQuery();
        }

        // 2. Query columns in CoinsSettings
        var existingCoinsCols = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SHOW COLUMNS FROM `CoinsSettings`;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    existingCoinsCols.Add(reader["Field"].ToString().ToLower());
                }
            }
        }

        var colsToEnsure = new Dictionary<string, string>
        {
            { "RupeesRequiredForOneCoin", "INT NOT NULL DEFAULT 20" },
            { "MinimumOrderValue", "DECIMAL(18,2) NOT NULL DEFAULT 100.00" },
            { "MaxCartRedeemPercent", "DECIMAL(18,2) NOT NULL DEFAULT 20.00" },
            { "WelcomeBonusCoins", "INT NOT NULL DEFAULT 25" },
            { "CoinValidityDays", "INT NOT NULL DEFAULT 180" },
            { "IsWelcomeBonusEnabled", "TINYINT(1) NOT NULL DEFAULT 1" },
            { "IsActive", "TINYINT(1) NOT NULL DEFAULT 1" }
        };

        foreach (var c in colsToEnsure)
        {
            if (!existingCoinsCols.Contains(c.Key.ToLower()))
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"ALTER TABLE `CoinsSettings` ADD COLUMN `{c.Key}` {c.Value};";
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // 3. Ensure at least one default row in CoinsSettings
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM `CoinsSettings`;";
            int count = Convert.ToInt32(cmd.ExecuteScalar());
            if (count == 0)
            {
                cmd.CommandText = @"
                    INSERT INTO `CoinsSettings` (
                        `ConversionRate`, `EarnRate`, `MinRedeemableCoins`, `MaxRedeemableCoins`, 
                        `RupeesRequiredForOneCoin`, `MinimumOrderValue`, `MaxCartRedeemPercent`, 
                        `WelcomeBonusCoins`, `CoinValidityDays`, `IsWelcomeBonusEnabled`, `IsActive`
                    ) VALUES (
                        1.00, 0.05, 100, 5000, 
                        20, 100.00, 20.00, 
                        25, 180, 1, 1
                    );";
                cmd.ExecuteNonQuery();
            }
        }

        // 3.5 Create ManualPayments table if it does not exist
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `ManualPayments` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `OrderId` VARCHAR(100) NOT NULL,
                    `UtrNumber` VARCHAR(100) NOT NULL,
                    `AmountPaid` DECIMAL(18,2) NOT NULL,
                    `PaymentDate` VARCHAR(50) NOT NULL,
                    `PaymentTime` VARCHAR(50) NOT NULL,
                    `CustomerName` VARCHAR(200) NOT NULL,
                    `MobileNumber` VARCHAR(50) NOT NULL,
                    `Remarks` TEXT NULL,
                    `ScreenshotUrl` VARCHAR(500) NULL,
                    `VerificationStatus` VARCHAR(50) NOT NULL DEFAULT 'Pending',
                    `SubmittedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();
        }

        // 3.6 Create BankDetailsConfigs, UpiDetailsConfigs, and QrCodeConfigs tables if they do not exist
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `BankDetailsConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `IfscCode` VARCHAR(100) NOT NULL,
                    `BankName` VARCHAR(200) NOT NULL,
                    `Branch` VARCHAR(200) NOT NULL,
                    `AccountNumber` VARCHAR(100) NOT NULL,
                    `AccountHolderName` VARCHAR(200) NOT NULL,
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `UpiDetailsConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `MerchantUpiId` VARCHAR(200) NOT NULL,
                    `MerchantName` VARCHAR(200) NOT NULL,
                    `BankDisplayName` VARCHAR(200) NOT NULL,
                    `Currency` VARCHAR(50) NOT NULL DEFAULT 'INR',
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `QrCodeConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `QrImageUrl` VARCHAR(500) NOT NULL,
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();
        }

        // 3.7 Ensure extra columns exist in Suppliers table
        var existingSupplierCols = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SHOW COLUMNS FROM `Suppliers`;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    existingSupplierCols.Add(reader["Field"].ToString().ToLower());
                }
            }
        }

        var supplierColsToEnsure = new System.Collections.Generic.Dictionary<string, string>
        {
            { "Gstin", "VARCHAR(100) NULL" },
            { "ProductCategory", "VARCHAR(200) NULL" },
            { "TrackingId", "VARCHAR(50) NULL" },
            { "Status", "VARCHAR(50) NOT NULL DEFAULT 'Pending'" }
        };

        foreach (var c in supplierColsToEnsure)
        {
            if (!existingSupplierCols.Contains(c.Key.ToLower()))
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"ALTER TABLE `Suppliers` ADD COLUMN `{c.Key}` {c.Value};";
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // 3.8 Create SupportConfigs and SupportTickets tables if they do not exist
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `SupportConfigs` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `SupportPhoneNumber` VARCHAR(50) NOT NULL,
                    `WorkTimings` VARCHAR(150) NOT NULL,
                    `SupportEmail` VARCHAR(150) NOT NULL,
                    `UpdatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();

            // Seed default row if SupportConfigs is empty
            cmd.CommandText = "SELECT COUNT(*) FROM `SupportConfigs`;";
            int supportConfigCount = Convert.ToInt32(cmd.ExecuteScalar());
            if (supportConfigCount == 0)
            {
                cmd.CommandText = @"
                    INSERT INTO `SupportConfigs` (
                        `SupportPhoneNumber`, `WorkTimings`, `SupportEmail`, `UpdatedAt`
                    ) VALUES (
                        '+91 98765 43210', 'Mon-Sat: 10AM - 7PM', 'support@shyamagro.com', NOW()
                    );";
                cmd.ExecuteNonQuery();
            }

            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `SupportTickets` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Name` VARCHAR(150) NOT NULL,
                    `Email` VARCHAR(150) NOT NULL,
                    `Phone` VARCHAR(50) NOT NULL,
                    `Subject` VARCHAR(250) NOT NULL,
                    `Message` TEXT NOT NULL,
                    `Status` VARCHAR(50) NOT NULL DEFAULT 'Open',
                    `CreatedAt` DATETIME NOT NULL
                );";
            cmd.ExecuteNonQuery();
        }

        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS `Banners` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `Title` VARCHAR(250) NOT NULL DEFAULT '',
                    `Subtitle` VARCHAR(500) NOT NULL DEFAULT '',
                    `ImageUrl` TEXT NOT NULL,
                    `TargetUrl` VARCHAR(500) NOT NULL DEFAULT '/categories',
                    `BannerType` VARCHAR(50) NOT NULL DEFAULT 'Hero',
                    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
                    `DisplayOrder` INT NOT NULL DEFAULT 0,
                    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );";
            cmd.ExecuteNonQuery();
        }

        // 3.8.1 Seed default active banners if Banners table is empty
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM `Banners`;";
            var count = Convert.ToInt32(cmd.ExecuteScalar());
            if (count == 0)
            {
                using (var insertCmd = conn.CreateCommand())
                {
                    insertCmd.CommandText = @"
                        INSERT INTO `Banners` (`Title`, `Subtitle`, `ImageUrl`, `TargetUrl`, `BannerType`, `IsActive`, `DisplayOrder`, `CreatedAt`) VALUES
                        ('Advanced Agriculture Tools', 'High Precision Farm Machinery & Spraying Equipment', 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1600&q=80', '/categories', 'Hero', 1, 1, NOW()),
                        ('Modern Power Sprayers & Pumps', 'Heavy Duty Motorized & Battery Operated Sprayers', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1600&q=80', '/categories', 'Hero', 1, 2, NOW()),
                        ('Special Discount on Garden Tools', 'Up to 30% Off on Premium Pruning & Shovel Tools', 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1600&q=80', '/categories', 'Promo', 1, 1, NOW()),
                        ('Organic Fertilizers & Soil Care', 'Boost Crop Yield Naturally with Organic Soil Boosters', 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1600&q=80', '/categories', 'Promo', 1, 2, NOW()),
                        ('Trusted by 50,000+ Indian Farmers', '100% Genuine Quality Guarantee & Doorstep Delivery', 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1600&q=80', '/categories', 'Trust', 1, 1, NOW());";
                    insertCmd.ExecuteNonQuery();
                }
            }
        }

        // 3.9 Ensure extra columns exist in Coupons table
        var existingCouponCols = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SHOW COLUMNS FROM `Coupons`;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    existingCouponCols.Add(reader["Field"].ToString().ToLower());
                }
            }
        }

        var couponColsToEnsure = new System.Collections.Generic.Dictionary<string, string>
        {
            { "Title", "VARCHAR(250) NULL" },
            { "Description", "TEXT NULL" },
            { "TermsAndConditions", "TEXT NULL" },
            { "BackgroundImageUrl", "VARCHAR(500) NULL" },
            { "BannerImageUrl", "VARCHAR(500) NULL" },
            { "ThumbnailImageUrl", "VARCHAR(500) NULL" },
            { "MaxDiscountAmount", "DECIMAL(18,2) NULL" },
            { "CreatedDate", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" },
            { "UpdatedDate", "DATETIME NULL" }
        };

        foreach (var c in couponColsToEnsure)
        {
            if (!existingCouponCols.Contains(c.Key.ToLower()))
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"ALTER TABLE `Coupons` ADD COLUMN `{c.Key}` {c.Value};";
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // 3.10 Ensure DisplayOrder column exists in Categories table
        var existingCatCols = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SHOW COLUMNS FROM `Categories`;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    existingCatCols.Add(reader["Field"].ToString().ToLower());
                }
            }
        }
        if (!existingCatCols.Contains("displayorder"))
        {
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "ALTER TABLE `Categories` ADD COLUMN `DisplayOrder` INT NOT NULL DEFAULT 0;";
                cmd.ExecuteNonQuery();
            }
        }

        // 3.11 Ensure DisplayOrder column exists in Subcategories table
        var existingSubcatCols = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SHOW COLUMNS FROM `Subcategories`;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    existingSubcatCols.Add(reader["Field"].ToString().ToLower());
                }
            }
        }
        if (!existingSubcatCols.Contains("displayorder"))
        {
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "ALTER TABLE `Subcategories` ADD COLUMN `DisplayOrder` INT NOT NULL DEFAULT 0;";
                cmd.ExecuteNonQuery();
            }
        }

        // 4. Cleanup mismatched foreign keys from orderitems table to avoid FK constraint errors with Orders table
        var fkNames = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orderitems' AND CONSTRAINT_NAME <> 'PRIMARY' AND CONSTRAINT_NAME IS NOT NULL;";
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    var fkName = reader[0]?.ToString();
                    if (!string.IsNullOrEmpty(fkName))
                    {
                        fkNames.Add(fkName);
                    }
                }
            }
        }

        foreach (var fkName in fkNames)
        {
            try
            {
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"ALTER TABLE `orderitems` DROP FOREIGN KEY `{fkName}`;";
                    cmd.ExecuteNonQuery();
                }
            }
            catch { }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Database schema setup warning: " + ex.Message);
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

// CORS MUST come before Authentication
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();