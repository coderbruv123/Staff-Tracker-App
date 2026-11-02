using Microsoft.AspNetCore.Identity;
using StaffTracker.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace StaffTracker.Api.Services;

public interface IUserService
{
    Task<ApplicationUser?> GetCurrentUserAsync();
    bool IsAdmin();
    bool IsStaff();
    Task<int?> GetCurrentStaffIdAsync();
    Task<ApplicationUser?> FindByEmailAsync(string email);
    Task<IdentityResult> CreateUserAsync(string email, string password, string displayName, string roleHint);
}

public class UserService : IUserService
{
    private readonly IHttpContextAccessor _http;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly StaffTrackerDbContext _ctx;

    public UserService(IHttpContextAccessor http, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, StaffTrackerDbContext ctx)
    {
        _http = http; _userManager = userManager; _roleManager = roleManager; _ctx = ctx;
    }

    public Task<ApplicationUser?> GetCurrentUserAsync() => _userManager.GetUserAsync(_http.HttpContext?.User);

    public bool IsAdmin() => _http.HttpContext?.User.IsInRole("Admin") == true;

    public bool IsStaff() => _http.HttpContext?.User.IsInRole("Staff") == true;

    public async Task<int?> GetCurrentStaffIdAsync()
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return null;
        var staff = await _ctx.Staffs.FirstOrDefaultAsync(s => s.UserId == user.Id);
        return staff?.Id;
    }

    public Task<ApplicationUser?> FindByEmailAsync(string email) => _userManager.FindByEmailAsync(email);

    public async Task<IdentityResult> CreateUserAsync(string email, string password, string displayName, string roleHint)
    {
        var user = new ApplicationUser { Email = email, UserName = email, DisplayName = displayName };
        var r = await _userManager.CreateAsync(user, password);
        if (r.Succeeded)
        {
            var role = (roleHint ?? "Staff").Trim().ToLowerInvariant();
            if (role == "admin") await _userManager.AddToRoleAsync(user, "Admin");
            else await _userManager.AddToRoleAsync(user, "Staff");
        }
        return r;
    }
}
