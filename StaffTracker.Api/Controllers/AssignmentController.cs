using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using StaffTracker.Api.Hubs;
using StaffTracker.Api.Data;
using StaffTracker.Api.Models;
using StaffTracker.Api.Services;

namespace StaffTracker.Api.Controllers;

[ApiController]
[Route("api/assignments")]
public class AssignmentController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;
    private readonly ICheckInService _checkInService;
    private readonly IUserService _userService;
    private readonly StaffTrackerDbContext _ctx;
    private readonly ILogger<AssignmentController> _log;
    private readonly IHubContext<StatusHub> _hub;

    public AssignmentController(IAssignmentService assignmentService, ICheckInService checkInService, IUserService userService, StaffTrackerDbContext ctx, ILogger<AssignmentController> log, IHubContext<StatusHub> hub)
    {
        _assignmentService = assignmentService; _checkInService = checkInService; _userService = userService; _ctx = ctx; _log = log; _hub = hub;
    }

    [HttpGet("today")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetToday()
    {
        int? staffId = null;
        if (_userService.IsAdmin()) staffId = null;
        else if (_userService.IsStaff()) staffId = await _userService.GetCurrentStaffIdAsync();

        var list = await _assignmentService.GetTodayAssignmentsAsync(staffId?.ToString());
        return Ok(new { date = DateOnly.FromDateTime(DateTime.Today), assignments = list.Select(a => new
        {
            a.Id, a.StaffId, staffDisplayName = a.Staff?.DisplayName, staffEmployeeNumber = a.Staff?.EmployeeNumber,
            a.LocationId, locationName = a.Location?.Name, locationAddress = a.Location?.Address,
            locationLatitude = a.Location?.Latitude, locationLongitude = a.Location?.Longitude,
            a.Status, a.Note, a.CheckedInAt, a.CheckedOutAt
        }) });
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetAll([FromQuery] string? date)
    {
        var day = string.IsNullOrEmpty(date) ? DateOnly.FromDateTime(DateTime.Today) : DateOnly.Parse(date);
        var list = await _assignmentService.GetTodayAssignmentsAsync(null);
        var counts = list.GroupBy(a => a.Status).ToDictionary(g => g.Key, g => g.Count());
        return Ok(new { date = day, assignments = list.Select(a => new
        {
            a.Id, a.StaffId, staffDisplayName = a.Staff?.DisplayName, staffEmployeeNumber = a.Staff?.EmployeeNumber,
            a.LocationId, locationName = a.Location?.Name, locationAddress = a.Location?.Address,
            a.Status, a.Note, a.CheckedInAt, a.CheckedOutAt
        }), total = list.Count, reached = counts.GetValueOrDefault("Reached", 0),
        inProgress = counts.GetValueOrDefault("InProgress", 0),
        pending = counts.GetValueOrDefault("Pending", 0),
        notReached = counts.GetValueOrDefault("NotReached", 0) });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> Create([FromBody] CreateAssignmentDto dto)
    {
        if (dto.StaffId <= 0 || dto.LocationId <= 0)
            return BadRequest(new { error = "staffId and locationId are required" });

        var date = dto.Date ?? DateOnly.FromDateTime(DateTime.Today);
        var a = await _assignmentService.CreateAssignmentAsync(dto.StaffId, dto.LocationId, date);
        await BroadcastUpdateAsync();
        return Ok(new
        {
            message = "Assignment created",
            assignment = new
            {
                a.Id,
                a.StaffId,
                a.LocationId,
                a.Date,
                a.Status,
                a.Note,
                a.CheckedInAt,
                a.CheckedOutAt
            }
        });
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<object>> UpdateStatus(int id, [FromBody] StatusUpdateDto dto)
    {
        if (string.IsNullOrEmpty(dto.Status))
            return BadRequest(new { error = "status is required" });

        var allowed = new[] { "Pending", "InProgress", "Reached", "NotReached" };
        if (Array.IndexOf(allowed, dto.Status) < 0)
            return BadRequest(new { error = $"status must be one of {string.Join(", ", allowed)}" });

        if (_userService.IsAdmin())
        {
            await _assignmentService.UpdateStatusAsync(id, dto.Status, dto.Note);
            await BroadcastUpdateAsync();
            return Ok(new { message = "Status updated" });
        }

        var assignment = await _assignmentService.GetAssignmentAsync(id);
        if (assignment == null) return NotFound(new { error = "Assignment not found" });
        if (assignment.StaffId != (await _userService.GetCurrentStaffIdAsync()))
            return StatusCode(403, new { error = "You can only update your own assignments" });

        await _assignmentService.UpdateStatusAsync(id, dto.Status, dto.Note);
        await BroadcastUpdateAsync();
        return Ok(new { message = "Status updated" });
    }

    [HttpGet("history/{staffId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetHistory(int staffId)
    {
        var list = await _assignmentService.GetHistoryAsync(staffId);
        return Ok(new { assignments = list.Select(a => new
        {
            a.Id, a.Date, a.Status, a.Note, a.CheckedInAt, a.CheckedOutAt,
            location = a.Location?.Name
        }) });
    }

    private async Task BroadcastUpdateAsync()
    {
        await _hub.Clients.All.SendAsync("StatusUpdated", new { success = true });
    }
}
