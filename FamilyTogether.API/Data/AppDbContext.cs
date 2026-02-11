using Microsoft.EntityFrameworkCore;
using FamilyTogether.API.Models;

namespace FamilyTogether.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Family> Families { get; set; } = null!;
        public DbSet<Member> Members { get; set; } = null!;
        public DbSet<TaskEntity> Tasks { get; set; } = null!;
        public DbSet<PointTransaction> PointTransactions { get; set; } = null!;
        public DbSet<Reward> Rewards { get; set; } = null!;
        public DbSet<RewardRedemption> RewardRedemptions { get; set; } = null!;
        public DbSet<SyncLog> SyncLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Family Configuration
            modelBuilder.Entity<Family>(entity =>
            {
                entity.ToTable("families");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
                entity.Property(e => e.LastModified).IsRequired();
                entity.HasIndex(e => e.LastModified);
                entity.HasIndex(e => e.IsDeleted);
                entity.HasQueryFilter(e => !e.IsDeleted);
            });

            // Member Configuration
            modelBuilder.Entity<Member>(entity =>
            {
                entity.ToTable("members");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PointsBalance).HasDefaultValue(0);
                entity.HasIndex(e => e.FamilyId);
                entity.HasIndex(e => e.LastModified);
                entity.HasIndex(e => e.IsDeleted);
                entity.HasQueryFilter(e => !e.IsDeleted);

                // Relationships
                entity.HasOne(e => e.Family)
                      .WithMany(f => f.Members)
                      .HasForeignKey(e => e.FamilyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Task Configuration
            modelBuilder.Entity<TaskEntity>(entity =>
            {
                entity.ToTable("tasks");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.FamilyId);
                entity.HasIndex(e => e.AssignedTo);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.LastModified);
                entity.HasIndex(e => e.IsDeleted);
                entity.HasQueryFilter(e => !e.IsDeleted);

                // Relationships
                entity.HasOne(e => e.Family)
                      .WithMany(f => f.Tasks)
                      .HasForeignKey(e => e.FamilyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Point Transaction Configuration
            modelBuilder.Entity<PointTransaction>(entity =>
            {
                entity.ToTable("point_transactions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TransactionType).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.FamilyId);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.IsDeleted);
                entity.HasQueryFilter(e => !e.IsDeleted);

                // Relationships
                entity.HasOne(e => e.Family)
                      .WithMany()
                      .HasForeignKey(e => e.FamilyId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Member)
                      .WithMany()
                      .HasForeignKey(e => e.MemberId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Reward Configuration
            modelBuilder.Entity<Reward>(entity =>
            {
                entity.ToTable("rewards");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Cost).IsRequired();
                entity.HasIndex(e => e.FamilyId);
                entity.HasIndex(e => e.IsDeleted);
                entity.HasQueryFilter(e => !e.IsDeleted);

                // Relationships
                entity.HasOne(e => e.Family)
                      .WithMany()
                      .HasForeignKey(e => e.FamilyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Reward Redemption Configuration
            modelBuilder.Entity<RewardRedemption>(entity =>
            {
                entity.ToTable("reward_redemptions");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.FamilyId);
                entity.HasIndex(e => e.IsDeleted);
                entity.HasQueryFilter(e => !e.IsDeleted);

                // Relationships
                entity.HasOne(e => e.Family)
                      .WithMany()
                      .HasForeignKey(e => e.FamilyId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Reward)
                      .WithMany()
                      .HasForeignKey(e => e.RewardId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Member)
                      .WithMany()
                      .HasForeignKey(e => e.MemberId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Sync Log Configuration (No soft delete)
            modelBuilder.Entity<SyncLog>(entity =>
            {
                entity.ToTable("sync_logs");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.SyncTimestamp);
            });
        }
    }
}
