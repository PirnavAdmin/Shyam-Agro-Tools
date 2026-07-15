using Microsoft.EntityFrameworkCore;
using ShyamAgroSuite.Api.Models;

namespace ShyamAgroSuite.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Admin User Table
        public DbSet<User> Users { get; set; }

        // Cart
        public DbSet<CartItem> CartItems { get; set; }

        // Customer Address
        public DbSet<CustomerAddress> CustomerAddresses { get; set; }

        // Order Success
        public DbSet<OrderSuccess> OrderSuccesses { get; set; }

        // Catalog tables
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<ProductVideo> ProductVideos { get; set; }
        public DbSet<ProductFeature> ProductFeatures { get; set; }
        public DbSet<ProductReview> ProductReviews { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Subcategory> Subcategories { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<CoinsSettings> CoinsSettings { get; set; }
        public DbSet<Customer> Customers { get; set; }

        // --- Newly Added from ApplicationDbContext ---
        public DbSet<TestUser> TestUsers { get; set; }
        public DbSet<Blog> Blogs { get; set; }
        public DbSet<Brand> Brands { get; set; }
        public DbSet<GrowerUser> GrowerUsers { get; set; }
        public DbSet<CustomerAgrarian> CustomerAgrarians { get; set; }
        public DbSet<CustomerAdvisory> CustomerAdvisories { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<SystemSettings> SystemSettings { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<WishlistItem> WishlistItems { get; set; }
        public DbSet<Testimonial> Testimonials { get; set; }
        public DbSet<WalletTransaction> WalletTransactions { get; set; }
        public DbSet<ManualPayment> ManualPayments { get; set; }
        public DbSet<BankDetailsConfig> BankDetailsConfigs { get; set; }
        public DbSet<UpiDetailsConfig> UpiDetailsConfigs { get; set; }
        public DbSet<QrCodeConfig> QrCodeConfigs { get; set; }
        public DbSet<SupportConfig> SupportConfigs { get; set; }
        public DbSet<SupportTicket> SupportTickets { get; set; }
        public DbSet<OrderTrackingLog> OrderTrackingLogs { get; set; }
        public DbSet<StockLedgerLog> StockLedgerLogs { get; set; }
        public DbSet<CallLog> CallLogs { get; set; }
        public DbSet<ReturnRequest> ReturnRequests { get; set; }
        public DbSet<ReturnEvidence> ReturnEvidences { get; set; }
        public DbSet<ReturnTimeline> ReturnTimelines { get; set; }
        public DbSet<ReturnPickup> ReturnPickups { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ReturnRequest Unique Constraint
            modelBuilder.Entity<ReturnRequest>()
                .HasIndex(r => r.OrderItemId)
                .IsUnique();

            // Wishlist Table
            modelBuilder.Entity<WishlistItem>(entity =>
            {
                entity.ToTable("WishlistItems");
                entity.HasIndex(w => new { w.UserPhone, w.ProductId }).IsUnique();
            });

            // Admin User Table
            modelBuilder.Entity<User>()
                .ToTable("admin_user");

            // Cart Table
            modelBuilder.Entity<CartItem>()
                .ToTable("CartItems");

            // Customer Address Table
            modelBuilder.Entity<CustomerAddress>()
                .ToTable("CustomerAddresses");

            // Order Success Table
            modelBuilder.Entity<OrderSuccess>()
                .ToTable("order_success");

            // Testimonials Table
            modelBuilder.Entity<Testimonial>()
                .ToTable("Testimonials");

            // Order Table
            modelBuilder.Entity<Order>()
                .ToTable("Orders");

            // OrderItem Table
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.ToTable("orderitems");
                entity.Property(e => e.Price).HasColumnName("UnitPrice");
                entity.Property(e => e.Subtotal).HasColumnName("LineTotal");
            });

            // Customer -> GrowerUser (many-to-one, optional)
            modelBuilder.Entity<Customer>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Customer -> CustomerAgrarian (1-to-1)
            modelBuilder.Entity<Customer>()
                .HasOne(c => c.AgrarianProfile)
                .WithOne(a => a.Customer)
                .HasForeignKey<CustomerAgrarian>(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Customer -> CustomerAdvisory (1-to-many)
            modelBuilder.Entity<Customer>()
                .HasMany(c => c.Advisories)
                .WithOne(a => a.Customer)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // CustomerAdvisory -> Staff
            modelBuilder.Entity<CustomerAdvisory>()
                .HasOne(a => a.Staff)
                .WithMany()
                .HasForeignKey(a => a.StaffId)
                .OnDelete(DeleteBehavior.Restrict);

            // Customer -> Order (1-to-many)
            modelBuilder.Entity<Customer>()
                .HasMany(c => c.Orders)
                .WithOne(o => o.Customer)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Order -> OrderItem (1-to-many)
            modelBuilder.Entity<Order>()
                .HasMany(o => o.Items)
                .WithOne(i => i.Order)
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relationships & Cascade settings
            modelBuilder.Entity<ProductImage>()
                .HasOne<Product>()
                .WithMany(p => p.Images)
                .HasForeignKey(pi => pi.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductVideo>()
                .HasOne<Product>()
                .WithMany(p => p.Videos)
                .HasForeignKey(pv => pv.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductFeature>()
                .HasOne<Product>()
                .WithMany(p => p.Features)
                .HasForeignKey(pf => pf.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductReview>()
                .HasOne<Product>()
                .WithMany(p => p.Reviews)
                .HasForeignKey(pr => pr.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Decimal Precision Configurations
            modelBuilder.Entity<Product>()
                .Property(p => p.MRP)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Product>()
                .Property(p => p.DiscountAmount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Product>()
                .Property(p => p.SellingPrice)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Product>()
                .Property(p => p.AverageRating)
                .HasPrecision(5, 2);

            modelBuilder.Entity<Coupon>()
                .Property(c => c.DiscountValue)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Coupon>()
                .Property(c => c.MinCartValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<CoinsSettings>()
                .Property(c => c.ConversionRate)
                .HasPrecision(18, 4);
            modelBuilder.Entity<CoinsSettings>()
                .Property(c => c.EarnRate)
                .HasPrecision(18, 4);

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Order>()
                .Property(o => o.DiscountAmount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Order>()
                .Property(o => o.ShippingFee)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Order>()
                .Property(o => o.GstAmount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Order>()
                .Property(o => o.FinalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(i => i.Price)
                .HasPrecision(18, 2);
            modelBuilder.Entity<OrderItem>()
                .Property(i => i.Subtotal)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SystemSettings>()
                .Property(s => s.GstPercentage)
                .HasPrecision(18, 2);
            modelBuilder.Entity<SystemSettings>()
                .Property(s => s.FlatShippingFee)
                .HasPrecision(18, 2);

            base.OnModelCreating(modelBuilder);
        }
    }
}
