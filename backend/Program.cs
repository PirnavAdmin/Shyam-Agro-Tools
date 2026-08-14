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

        // 1b. Ensure ProductReviews.Rating column is DECIMAL(5,2)
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
                    WHERE ca.Id IS NULL;

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

                    -- Deduplicate Orders table by OrderNumber
                    DELETE o1 FROM Orders o1
                    INNER JOIN Orders o2 ON o1.OrderNumber = o2.OrderNumber AND o1.Id > o2.Id;

                    -- Standardize OrderNumber strings
                    UPDATE Orders SET OrderNumber = REPLACE(OrderNumber, '#', '');
                    UPDATE Orders SET OrderNumber = REPLACE(OrderNumber, 'ORD-ORD-', 'ORD-');
                    UPDATE Orders SET OrderNumber = CONCAT('ORD-', OrderNumber) WHERE OrderNumber NOT LIKE 'ORD-%';

                    -- Synchronize PaymentStatus for completed, delivered, and cancelled orders
                    UPDATE Orders SET PaymentStatus = 'Paid' WHERE Status IN ('Completed', 'Delivered') AND PaymentStatus IN ('Pending', 'Pending Verification');
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

        // Reset Promo & Trust banners to their exact original previous images and text
        using (var resetCmd = conn.CreateCommand())
        {
            resetCmd.CommandText = @"
                DELETE FROM `Banners` WHERE `BannerType` IN ('Promo', 'Trust');

                INSERT INTO `Banners` (`Title`, `Subtitle`, `ImageUrl`, `TargetUrl`, `BannerType`, `IsActive`, `DisplayOrder`, `CreatedAt`) VALUES
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
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/cbd9bc55-e9d8-422d-ad81-5bafc2ad63fb.png' WHERE `ProductId` = 5 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/3b800ad7-3766-43ef-8717-9171e4506c43.png' WHERE `ProductId` = 6 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/78a4d353-0554-424d-92d5-3cf0f0aa4277.png' WHERE `ProductId` = 7 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/833984e2-4d41-409a-b7ff-93a700d635d3.png' WHERE `ProductId` = 8 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/416af294-e0b6-4dbe-825d-82fd77a9a673.png' WHERE `ProductId` = 9 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/363e842c-dd8e-4b09-b3b0-2fee1c467bcb.png' WHERE `ProductId` = 10 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/eff6b93d-4898-4bd7-8917-38a564c2bed6.png' WHERE `ProductId` = 12 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/b7a820b5-7110-4342-afb2-affdd37a61da.png' WHERE `ProductId` = 14 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/cab50a2e-61a5-4323-b0cb-9231c9970408.png' WHERE `ProductId` = 15 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/42885a07-74c0-4d50-abc6-7fe4c1925420.png' WHERE `ProductId` = 16 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/a5edb2e7-0b28-4252-8349-7ee134ccdc27.jfif' WHERE `ProductId` = 17 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/a385120c-4585-4317-adb7-8b60a1c597d3.png' WHERE `ProductId` = 18 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/73e1918b-c536-483a-8f0f-02e54c3c389e.png' WHERE `ProductId` = 19 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/13861506-405a-41da-9010-486e5a76cb98.png' WHERE `ProductId` = 20 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/dadca29f-b643-40a6-9d8d-fb89488ab1a8.png' WHERE `ProductId` = 21 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/05f0aadc-df96-4b28-b4fb-cf7a623292da.png' WHERE `ProductId` = 22 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/4208e0c4-214a-4d33-b4f9-59e8235f740d.png' WHERE `ProductId` = 23 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/acf34493-5a93-4cbd-9a0b-943933d69c73.png' WHERE `ProductId` = 25 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/c5c37b91-b771-458f-8cc3-c085e9925f63.jpg' WHERE `ProductId` = 32 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/45ce6a6d-4e96-4e69-b37c-8ce4b3814d50.jpg' WHERE `ProductId` = 34 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/c7cb595f-0ffe-4766-9e1a-0c74caa04a21.jpg' WHERE `ProductId` = 35 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/ecbdb140-7e88-4ac4-bd33-ac3317827681.jpg' WHERE `ProductId` = 36 LIMIT 1;
                 UPDATE `ProductImages` SET `ImageUrl` = '/uploads/images/4f199761-0534-4c8d-9576-d37b078c5f59.jfif' WHERE `ProductId` = 37 LIMIT 1;

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
