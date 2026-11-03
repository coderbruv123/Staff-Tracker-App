using Microsoft.AspNetCore.Identity;
using StaffTracker.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace StaffTracker.Api.Services;

public class DataSeed : IDataSeed
{
    private readonly StaffTrackerDbContext _ctx;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;

    public DataSeed(StaffTrackerDbContext ctx, RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager)
    {
        _ctx = ctx; _roleManager = roleManager; _userManager = userManager;
    }

    public async Task SeedAsync()
    {
        if (!await _roleManager.RoleExistsAsync("Admin"))
            await _roleManager.CreateAsync(new IdentityRole("Admin"));
        if (!await _roleManager.RoleExistsAsync("Staff"))
            await _roleManager.CreateAsync(new IdentityRole("Staff"));

        // ---- Admin ----
        var admin = await _userManager.FindByEmailAsync("admin@stafftracker.local");
        if (admin == null)
        {
            admin = new ApplicationUser { Email = "admin@stafftracker.local", UserName = "admin@stafftracker.local", DisplayName = "System Admin" };
            var r = await _userManager.CreateAsync(admin, "Admin123!");
            if (r.Succeeded) await _userManager.AddToRoleAsync(admin, "Admin");
        }
        EnsureStaffLinked(admin, "ADMIN-001", "System Admin", "000-000-0000", "Active");

        // ---- Sample staff ----
        var staffEmails = new[] { "staff1@example.com", "staff2@example.com", "staff3@example.com" };
        for (int i = 0; i < staffEmails.Length; i++)
        {
            var email = staffEmails[i];
            var u = await _userManager.FindByEmailAsync(email);
            if (u == null)
            {
                u = new ApplicationUser { Email = email, UserName = email, DisplayName = Capitalize(email.Split('@')[0]), RegistrationStatus = "Active" };
                var r = await _userManager.CreateAsync(u, "Staff123!");
                if (r.Succeeded) await _userManager.AddToRoleAsync(u, "Staff");
            }
            EnsureStaffLinked(u, "STAFF-" + (i + 1).ToString("D3"), Capitalize(email.Split('@')[0]), (i + 1).ToString("D3") + "-555-0100", "Active");
        }

        // ---- Locations ----
        if (!_ctx.Locations.Any())
        {
            _ctx.Locations.AddRange(
                new Location { Name = "Location 1", Address = "100 Main St, City A", IsActive = true, Latitude = 40.7128, Longitude = -74.0060 },
                new Location { Name = "Location 2", Address = "200 Oak Ave, City B", IsActive = true, Latitude = 51.5074, Longitude = -0.1278 },
                new Location { Name = "Location 3", Address = "300 Pine Rd, City C", IsActive = true, Latitude = 35.6762, Longitude = 139.6503 });
            await _ctx.SaveChangesAsync();
        }

        await _ctx.SaveChangesAsync();
    }

    private void EnsureStaffLinked(ApplicationUser user, string employeeNumber, string displayName, string phone, string status)
    {
        var staff = _ctx.Staffs.FirstOrDefault(s => s.UserId == user.Id);
        if (staff == null)
        {
            staff = new Staff
            {
                UserId = user.Id,
                User = user,
                EmployeeNumber = employeeNumber,
                DisplayName = displayName,
                Phone = phone,
                Status = status
            };
            _ctx.Staffs.Add(staff);
        }
        else
        {
            staff.EmployeeNumber = employeeNumber;
            staff.DisplayName = displayName;
            staff.Phone = phone;
            staff.Status = status;
        }
    }

    private static string Capitalize(string s) => string.Concat(s[0].ToString().ToUpper(), s.Substring(1));
}
