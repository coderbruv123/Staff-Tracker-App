using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StaffTracker.Api.Data;
using StaffTracker.Api.Models;
using StaffTracker.Api.Services;

namespace StaffTracker.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/locations")]
public class LocationController : ControllerBase
{
    private readonly StaffTrackerDbContext _ctx;
    private readonly ILogger<LocationController> _log;

    public LocationController(StaffTrackerDbContext ctx, ILogger<LocationController> log)
    {
        _ctx = ctx; _log = log;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetLocations()
    {
        var locations = await _ctx.Locations.Where(l => l.IsActive).ToListAsync();
        return Ok(locations.Select(l => new { l.Id, l.Name, l.Address, l.Notes }));
    }

    [HttpPost]
    public async Task<ActionResult<object>> CreateLocation([FromBody] CreateLocationDto dto)
    {
        if (string.IsNullOrEmpty(dto.Name))
            return BadRequest(new { error = "name is required" });

        var loc = new Location { Name = dto.Name, Address = dto.Address, Notes = dto.Notes };
        _ctx.Locations.Add(loc);
        await _ctx.SaveChangesAsync();

        // Assign every existing staff a task at this location for today
        var today = DateOnly.FromDateTime(DateTime.Today);
        var staff = await _ctx.Staffs.Where(s => s.Status == "Active").ToListAsync();
        foreach (var s in staff)
        {
            _ctx.DailyAssignments.Add(new DailyAssignment
            {
                StaffId = s.Id,
                LocationId = loc.Id,
                Date = today,
                Status = "Pending"
            });
        }
        await _ctx.SaveChangesAsync();

        return Ok(new { message = "Location created and assignments generated", location = new { loc.Id, loc.Name, loc.Address } });
    }
}
