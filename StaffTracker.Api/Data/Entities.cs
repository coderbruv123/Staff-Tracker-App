using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace StaffTracker.Api.Data;

public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }
    public string? RegistrationStatus { get; set; } = "Active";
}

public class StaffTrackerDbContext : IdentityDbContext<ApplicationUser>
{
    public StaffTrackerDbContext(DbContextOptions<StaffTrackerDbContext> options)
        : base(options)
    {
    }

    public DbSet<Staff> Staffs => Set<Staff>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<DailyAssignment> DailyAssignments => Set<DailyAssignment>();
    public DbSet<CheckInLog> CheckInLogs => Set<CheckInLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Staff>()
            .HasOne(s => s.User)
            .WithOne()
            .HasForeignKey<Staff>(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<DailyAssignment>()
            .HasOne(a => a.Staff)
            .WithMany(s => s.Assignments)
            .HasForeignKey(a => a.StaffId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<DailyAssignment>()
            .HasOne(a => a.Location)
            .WithMany(l => l.Assignments)
            .HasForeignKey(a => a.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CheckInLog>()
            .HasOne(c => c.Assignment)
            .WithMany(a => a.Logs)
            .HasForeignKey(c => c.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class Staff
{
    public int Id { get; set; }
    public string? EmployeeNumber { get; set; }
    public string? DisplayName { get; set; }
    public string? Phone { get; set; }
    public string? Department { get; set; }
    public string Status { get; set; } = "Active";
    public string? UserId { get; set; }
    public virtual ApplicationUser? User { get; set; }
    public virtual ICollection<DailyAssignment> Assignments { get; set; } = new List<DailyAssignment>();
}

public class Location
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public virtual ICollection<DailyAssignment> Assignments { get; set; } = new List<DailyAssignment>();
}

public class DailyAssignment
{
    public int Id { get; set; }
    public int StaffId { get; set; }
    public virtual Staff? Staff { get; set; }
    public int LocationId { get; set; }
    public virtual Location? Location { get; set; }
    public DateOnly Date { get; set; }
    public string Status { get; set; } = "Pending"; // Pending | InProgress | Reached | NotReached
    public string? Note { get; set; }
    public DateTime? CheckedInAt { get; set; }
    public DateTime? CheckedOutAt { get; set; }
    public virtual ICollection<CheckInLog> Logs { get; set; } = new List<CheckInLog>();
}

public class CheckInLog
{
    public int Id { get; set; }
    public int AssignmentId { get; set; }
    public virtual DailyAssignment? Assignment { get; set; }
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; } = "CheckIn"; // CheckIn | CheckOut | ManualStatusUpdate
    public string? Lat { get; set; }
    public string? Lng { get; set; }
}
