using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StaffTracker.Api.Data;
using StaffTracker.Api.Models;
using StaffTracker.Api.Services;

namespace StaffTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<AuthController> _log;

    public AuthController(IUserService userService, SignInManager<ApplicationUser> signInManager, ILogger<AuthController> log)
    {
        _userService = userService; _signInManager = signInManager; _log = log;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password) || string.IsNullOrEmpty(dto.DisplayName))
            return BadRequest(new { error = "email, password and displayName are required" });

        var r = await _userService.CreateUserAsync(dto.Email, dto.Password, dto.DisplayName, dto.RoleHint);
        if (r.Succeeded)
        {
            return Ok(new { message = "Registered successfully. Please log in.", email = dto.Email });
        }
        return BadRequest(new { errors = r.Errors.Select(e => e.Description) });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
            return BadRequest(new { error = "email and password are required" });

        var result = await _signInManager.PasswordSignInAsync(dto.Email, dto.Password, isPersistent: false, lockoutOnFailure: false);
        if (result.Succeeded)
        {
            var user = await _userService.GetCurrentUserAsync();
            return Ok(new
            {
                message = "Logged in",
                user = new
                {
                    user.Id,
                    user.Email,
                    user.DisplayName,
                    isAdmin = _userService.IsAdmin(),
                    isStaff = _userService.IsStaff()
                }
            });
        }
        if (result.IsLockedOut)
            return BadRequest(new { error = "Account locked out" });
        return Unauthorized(new { error = "Invalid email or password" });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("me")]
    public async Task<ActionResult<object>> GetMe()
    {
        var user = await _userService.GetCurrentUserAsync();
        if (user == null) return Unauthorized(new { error = "Not authenticated" });
        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            displayName = user.DisplayName,
            isAdmin = _userService.IsAdmin(),
            isStaff = _userService.IsStaff()
        });
    }
}
