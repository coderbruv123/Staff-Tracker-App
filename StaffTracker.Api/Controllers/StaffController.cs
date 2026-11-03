using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StaffTracker.Api.Data;
using StaffTracker.Api.Models;
using StaffTracker.Api.Services;

namespace StaffTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly StaffTrackerDbContext _ctx;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<StaffController> _log;

    public StaffController(IUserService userService, StaffTrackerDbContext ctx, UserManager<ApplicationUser> userManager, ILogger<StaffController> log)
    {
        _userService = userService; _ctx = ctx; _userManager = userManager; _log = log;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<object>>> GetStaff()
    {
        var staff = await _ctx.Staffs.Include(s => s.User).ToListAsync();
        return Ok(staff.Select(s => new
        {
            s.Id,
            s.EmployeeNumber,
            s.DisplayName,
            s.Phone,
            s.Department,
            s.Status,
            s.User?.Email,
            s.User?.RegistrationStatus
        }));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> CreateStaff([FromBody] CreateStaffDto dto)
    {
        if (string.IsNullOrEmpty(dto.EmployeeNumber) || string.IsNullOrEmpty(dto.DisplayName))
            return BadRequest(new { error = "employeeNumber and displayName are required" });

        var email = $"{dto.EmployeeNumber.Replace("-", "").ToLower()}@stafftracker.local";
        var user = await _userManager.FindByEmailAsync(email);
        if (user != null) return Conflict(new { error = "A staff member with this employee number already exists" });

        user = new ApplicationUser { Email = email, UserName = email, DisplayName = dto.DisplayName };
        var r = await _userManager.CreateAsync(user, "Staff123!");
        if (r.Succeeded)
        {
            await _userManager.AddToRoleAsync(user, "Staff");
            var staff = new Staff
            {
                EmployeeNumber = dto.EmployeeNumber,
                DisplayName = dto.DisplayName,
                Phone = dto.Phone,
                Department = dto.Department,
                Status = "Active",
                User = user
            };
            _ctx.Staffs.Add(staff);
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Staff created", staff = new { staff.Id, staff.EmployeeNumber, staff.DisplayName, staff.Status, user.Email } });
        }
        return BadRequest(new { errors = r.Errors.Select(e => e.Description) });
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<object>>> GetPending()
    {
        var pending = await _ctx.Staffs.Where(s => s.User != null && s.User.RegistrationStatus == "Pending").ToListAsync();
        return Ok(pending.Select(s => new { s.Id, s.EmployeeNumber, s.DisplayName, s.Status, s.User?.Email }));
    }

    [HttpPost("approve/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ApproveStaff(int id)
    {
        var staff = await _ctx.Staffs.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == id);
        if (staff == null) return NotFound(new { error = "Staff not found" });
        staff.User.RegistrationStatus = "Approved";
        _ctx.Staffs.Update(staff);
        await _ctx.SaveChangesAsync();
        return Ok(new { message = "Staff approved" });
    }

    [HttpGet("me")]
    [Authorize(Roles = "Staff")]
    public async Task<ActionResult<object>> GetCurrentProfile()
    {
        var staffId = await _userService.GetCurrentStaffIdAsync();
        if (staffId == null) return Unauthorized(new { error = "Staff profile not found" });
        var staff = await _ctx.Staffs.FindAsync(staffId.Value);
        if (staff == null) return NotFound(new { error = "Staff not found" });
        return Ok(new
        {
            staff.Id,
            staff.EmployeeNumber,
            staff.DisplayName,
            staff.Phone,
            staff.Department,
            staff.Status
        });
    }

    [HttpPost("me")]
    [Authorize(Roles = "Staff")]
    public async Task<ActionResult<object>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var staffId = await _userService.GetCurrentStaffIdAsync();
        if (staffId == null) return Unauthorized(new { error = "Staff profile not found" });
        var staff = await _ctx.Staffs.FindAsync(staffId.Value);
        if (staff == null) return NotFound(new { error = "Staff not found" });
        if (!string.IsNullOrEmpty(dto.DisplayName)) staff.DisplayName = dto.DisplayName;
        if (!string.IsNullOrEmpty(dto.Phone)) staff.Phone = dto.Phone;
        await _ctx.SaveChangesAsync();
        return Ok(new
        {
            message = "Profile updated",
            staff = new
            {
                staff.Id,
                staff.EmployeeNumber,
                staff.DisplayName,
                staff.Phone,
                staff.Department,
                staff.Status
            }
        });
    }
}
