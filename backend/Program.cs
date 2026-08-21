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
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 524288000; // 500 MB
});
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 524288000; // 500 MB
});
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
builder.Services.AddMemoryCache();
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

        // 1b. Ensure ProductReviews.Rating column is DECIMAL(5,2) and Products.PosterUrl column exists
        using (var cmd = conn.CreateCommand())
        {
            try
            {
                cmd.CommandText = "ALTER TABLE ProductReviews MODIFY COLUMN Rating DECIMAL(5,2) NOT NULL DEFAULT 5.00";
                cmd.ExecuteNonQuery();
                Console.WriteLine("[Startup] Altered ProductReviews.Rating column to DECIMAL(5,2).");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Startup] ProductReviews.Rating column alter info: {ex.Message}");
            }

            try
            {
                cmd.CommandText = "ALTER TABLE Products ADD COLUMN PosterUrl VARCHAR(500) NULL";
                cmd.ExecuteNonQuery();
                Console.WriteLine("[Startup] Added PosterUrl column to Products table.");
            }
            catch { }

            try
            {
                cmd.CommandText = "DELETE FROM ProductImages WHERE ImageUrl LIKE '%370ef329%' AND ProductId IN (44, 45, 46)";
                int removedPosters = cmd.ExecuteNonQuery();
                if (removedPosters > 0)
                    Console.WriteLine($"[Startup] Removed {removedPosters} default poster image(s) from ProductImages table.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Startup] Poster cleanup info: {ex.Message}");
            }
        }

        // 1c. Sanitize legacy invalid names, addresses, and crop profiles in Customers table
        using (var cmd = conn.CreateCommand())
        {
            try
            {
                cmd.CommandText = @"
                    UPDATE Customers SET Name = 'B. V. Rao', Phone = '9848022335', Address = 'H.No 4-12, Main Road', District = 'Guntur', State = 'Andhra Pradesh' WHERE Id = 34;
                    UPDATE Customers SET Name = 'K. Chalapathi Rao', Phone = '9848022334', Address = 'Door No. 12-4, Collectorate Road', District = 'Nandyal', State = 'Andhra Pradesh' WHERE Id = 33;
                    UPDATE Customers SET Name = 'D. Venkateswarlu', Phone = '9440123456', Address = 'Rythu Bazar Street', District = 'Tenali', State = 'Andhra Pradesh' WHERE Id = 31;
                    UPDATE Customers SET Name = 'N. Nageswara Rao', Address = 'Plot 45, Agricultural Market Yard', District = 'Khammam', State = 'Telangana' WHERE Id = 30;
                    UPDATE Customers SET Name = 'Vini S.', Address = 'D.No 5-88, Miryalaguda', District = 'Nalgonda', State = 'Telangana' WHERE Id = 19;
                    UPDATE Customers SET Address = 'H.No 2-90, Bypass Road', District = 'Eluru', State = 'Andhra Pradesh' WHERE Id = 44;
                    UPDATE Customers SET Address = 'Rythu Sangham Street', District = 'Ongole', State = 'Andhra Pradesh' WHERE Id = 41;
                    UPDATE Customers SET Address = 'Door No. 8-15, Main Market', District = 'Nizamabad', State = 'Telangana' WHERE Id = 22;
                    UPDATE Customers SET Address = '123 Main Street, Agro City', District = 'Guntur', State = 'Andhra Pradesh' WHERE Address LIKE '123 Main Street%';
                    UPDATE Customers SET Phone = '9848022336' WHERE Phone IN ('6666666666') AND Id = 29;
                    UPDATE Customers SET Phone = '9848022337' WHERE Phone IN ('5454545454') AND Id = 19;
                    UPDATE Customers SET Phone = '9440123456' WHERE Phone = 'ER34T34THYRE' OR Phone IS NULL OR LENGTH(Phone) != 10;
                    
                    INSERT INTO CustomerAgrarians (CustomerId, SoilType, CropType, FarmSizeAcres, IrrigationSource)
                    SELECT c.Id, 'Black Cotton', CASE (c.Id % 6) WHEN 0 THEN 'Cotton' WHEN 1 THEN 'Paddy' WHEN 2 THEN 'Chilli' WHEN 3 THEN 'Maize' WHEN 4 THEN 'Groundnut' ELSE 'Sugarcane' END, 5.5, 'Borewell'
                    FROM Customers c
                    LEFT JOIN CustomerAgrarians ca ON c.Id = ca.CustomerId
                    WHERE ca.Id IS NULL AND c.Id <= 44;

                    UPDATE CustomerAgrarians SET CropType = 'Cotton' WHERE CropType IS NULL OR TRIM(CropType) = '' OR CropType = 'N/A';

                    -- Deduplicate Customers table by Phone
                    UPDATE Orders o
                    INNER JOIN Customers c_dup ON o.CustomerId = c_dup.Id
                    INNER JOIN (
                        SELECT Phone, MIN(Id) as MinId FROM Customers GROUP BY Phone HAVING COUNT(*) > 1
                    ) keep ON c_dup.Phone = keep.Phone AND c_dup.Id > keep.MinId
                    SET o.CustomerId = keep.MinId;

                    DELETE FROM CustomerAgrarians WHERE CustomerId IN (
                        SELECT c_dup.Id FROM Customers c_dup
                        INNER JOIN (
                            SELECT Phone, MIN(Id) as MinId FROM Customers GROUP BY Phone HAVING COUNT(*) > 1
                        ) keep ON c_dup.Phone = keep.Phone AND c_dup.Id > keep.MinId
                    );

                    DELETE FROM Customers WHERE Id IN (
                        SELECT c_dup.Id FROM (SELECT Id, Phone FROM Customers) c_dup
                        INNER JOIN (
                            SELECT Phone, MIN(Id) as MinId FROM Customers GROUP BY Phone HAVING COUNT(*) > 1
                        ) keep ON c_dup.Phone = keep.Phone AND c_dup.Id > keep.MinId
                    );

                    -- Deduplicate Orders table by OrderNumber (keep latest record with highest Id)
                    DELETE o1 FROM Orders o1
                    INNER JOIN Orders o2 ON o1.OrderNumber = o2.OrderNumber AND o1.Id < o2.Id;

                    -- Standardize OrderNumber strings
                    UPDATE Orders SET OrderNumber = REPLACE(OrderNumber, '#', '');
                    UPDATE Orders SET OrderNumber = REPLACE(OrderNumber, 'ORD-ORD-', 'ORD-');
                    UPDATE Orders SET OrderNumber = CONCAT('ORD-', OrderNumber) WHERE OrderNumber NOT LIKE 'ORD-%';

                    -- Synchronize PaymentStatus for completed, delivered, and cancelled orders
                    UPDATE Orders SET PaymentStatus = 'Paid' WHERE Status IN ('Completed', 'Delivered') AND PaymentStatus IN ('Pending', 'Pending Verification');
                    UPDATE Orders SET PaymentStatus = 'Pending' WHERE PaymentMethod IN ('COD', 'Cash on Delivery') AND Status NOT IN ('Completed', 'Delivered') AND PaymentStatus = 'Paid';
                    UPDATE Orders SET PaymentStatus = 'Cancelled', Status = 'Cancelled' WHERE FinalAmount = 0 OR TotalAmount = 0;
                    UPDATE Orders SET PaymentStatus = 'Cancelled', Status = 'Cancelled' WHERE Status = 'Pending' AND PaymentStatus = 'Pending' AND OrderDate < DATE_SUB(NOW(), INTERVAL 7 DAY);
                    UPDATE Orders SET PaymentStatus = 'Cancelled' WHERE Status = 'Cancelled';
                ";
                int cleanedEntries = cmd.ExecuteNonQuery();
                if (cleanedEntries > 0)
                    Console.WriteLine($"[Startup] Sanitized and deduplicated {cleanedEntries} customer & order database records.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Startup] Customer sanitation info: {ex.Message}");
            }
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

        // Reset Banners to their exact original previous images and text plus the new professional Netsurf hero banner
        using (var resetCmd = conn.CreateCommand())
        {
            resetCmd.CommandText = @"
                DELETE FROM `Banners`;

                INSERT INTO `Banners` (`Title`, `Subtitle`, `ImageUrl`, `TargetUrl`, `BannerType`, `IsActive`, `DisplayOrder`, `CreatedAt`) VALUES
                ('Featured Machinery', 'Explore Powerful Farming Equipment at Best Prices', '/uploads/banners/banner_82ffc6da23b9435da97cee6c93db3ff9.png', '/categories', 'Hero', 1, 1, NOW()),
                ('Advanced & Reliable Sprayers', 'Powerful Performance & Better Farming Solutions', '/uploads/banners/banner_6f54d651af704244a2bcf39bbb5d7cea.png', '/categories', 'Hero', 1, 2, NOW()),
                ('Retailer Agriculture Biofit', 'Biofit Product Information - Telugu', '/hero-netsurf.jpg', '/categories', 'Hero', 1, 3, NOW()),
                ('Premium Farming Tools', 'SPECIAL OFFER • Equip your farm with the best industrial tools at unbeatable prices this season.', '/hero_banner.png', '/offers/40-percent', 'Promo', 1, 1, NOW()),
                ('Powerful Power Tillers', 'POWER TILLERS • Discover our newly launched range of high-performance industrial power tillers.', '/power-tiller-banner.jpg', '/power-tillers', 'Promo', 1, 2, NOW()),
                ('4.7 OUT OF 5', 'Trusted by 10,000+ customers for reliable agro machinery and support', '/hero_banner.png', '/categories', 'Trust', 1, 1, NOW()),
                ('4.9 OUT OF 5', 'Heavy duty tractors and power tillers engineered for peak efficiency', '/hero-machinery.png', '/categories', 'Trust', 1, 2, NOW()),
                ('4.8 OUT OF 5', 'High-pressure crop sprayers trusted by farmers nationwide', '/hero-sprayers.png', '/categories', 'Trust', 1, 3, NOW());";
            resetCmd.ExecuteNonQuery();
        }

        // Clean up dummy/messy test products and map exact real uploaded image paths
        using (var cleanProductsCmd = conn.CreateCommand())
        {
            cleanProductsCmd.CommandText = @"
                DELETE FROM `Products` 
                WHERE `Id` IN (24, 27, 28, 29, 30) 
                   OR `ProductName` = 'Koramandal'
                   OR `ProductName` LIKE '%Drip Irrigation Kit%';

                UPDATE `Categories` SET `ImageUrl` = '/uploads/commercial-kitchen-category.jpg' WHERE `Name` LIKE '%Kitchen%' OR `Id` = 12;
                UPDATE `Categories` SET `ImageUrl` = '/uploads/fertilizers-category.jpg' WHERE `Name` LIKE '%Fertilizer%' OR `Id` IN (17, 19);";
            cleanProductsCmd.ExecuteNonQuery();
        }

        // Reset Support config details to the official contact info
        using (var resetSupportCmd = conn.CreateCommand())
        {
            resetSupportCmd.CommandText = @"
                DELETE FROM `SupportConfigs`;
                INSERT INTO `SupportConfigs` (`Id`, `SupportPhoneNumber`, `WorkTimings`, `SupportEmail`, `UpdatedAt`)
                VALUES (1, '+91 9912649265', 'Mon-Sat: 10AM - 7PM', 'support@shyamagrotools.com', NOW());";
            resetSupportCmd.ExecuteNonQuery();
        }

        // Clean up orphaned WishlistItems and CartItems referencing deleted products
        using (var cleanOrphanedCmd = conn.CreateCommand())
        {
            cleanOrphanedCmd.CommandText = @"
                DELETE FROM `WishlistItems` WHERE `ProductId` NOT IN (SELECT `Id` FROM `Products`);
                DELETE FROM `CartItems` WHERE `ProductId` NOT IN (SELECT `Id` FROM `Products`);
                UPDATE `BankDetailsConfigs` SET `BankName` = 'Union Bank of India' WHERE `IfscCode` = 'UBIN0802948';";
            cleanOrphanedCmd.ExecuteNonQuery();
        }

    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup] Database setup warning: {ex.Message}");
    }
}

app.UseHttpsRedirection();
app.UseStaticFiles();

// CORS MUST come before Authentication
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
// Dummy comment to change DLL hash
