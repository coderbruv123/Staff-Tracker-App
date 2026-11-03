using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using StaffTracker.Api.Data;
using StaffTracker.Api.Hubs;
using StaffTracker.Api.Models;
using StaffTracker.Api.Services;

namespace StaffTracker.Api.Controllers;

[ApiController]
[Authorize(Roles = "Staff")]
[Route("api/checkins")]
public class CheckInController : ControllerBase
{
    private readonly ICheckInService _checkInService;
    private readonly IUserService _userService;
    private readonly IAssignmentService _assignmentService;
    private readonly ILogger<CheckInController> _log;
    private readonly IHubContext<StatusHub> _hub;

    public CheckInController(ICheckInService checkInService, IUserService userService, IAssignmentService assignmentService, ILogger<CheckInController> log, IHubContext<StatusHub> hub)
    {
        _checkInService = checkInService; _userService = userService; _assignmentService = assignmentService; _log = log; _hub = hub;
    }

    [HttpPost]
    public async Task<ActionResult<object>> CheckIn([FromBody] CheckInDto dto)
    {
        var staffId = await _userService.GetCurrentStaffIdAsync();
        if (staffId == null) return Unauthorized(new { error = "Staff profile not found" });

        var assignment = await _assignmentService.GetTodayAssignmentAsync(staffId.Value);
        if (assignment == null) return NotFound(new { error = "No assignment found for today" });

        // Promote the staff into progress on first check-in (Pending / NotReached),
        // and re-open a Reached assignment back into InProgress.
        if (assignment.Status == "Reached" ||
            assignment.Status == "Pending" ||
            assignment.Status == "NotReached")
        {
            assignment.Status = "InProgress";
        }

        var log = await _checkInService.CheckInAsync(assignment.Id, dto.Lat, dto.Lng);
        await BroadcastUpdateAsync();
        return Ok(new
        {
            message = "Checked in",
            log = new
            {
                log.Id,
                log.AssignmentId,
                log.Timestamp,
                log.EventType,
                log.Lat,
                log.Lng
            }
        });
    }

    [HttpPost("{id:int}/checkout")]
    public async Task<ActionResult> CheckOut(int id)
    {
        var staffId = await _userService.GetCurrentStaffIdAsync();
        if (staffId == null) return Unauthorized(new { error = "Staff profile not found" });

        var assignment = await _assignmentService.GetAssignmentAsync(id);
        if (assignment == null) return NotFound(new { error = "Assignment not found" });
        if (assignment.StaffId != staffId.Value) return StatusCode(403, new { error = "You can only check out of your own assignment" });

        await _checkInService.CheckOutAsync(id);
        await BroadcastUpdateAsync();
        return Ok(new { message = "Checked out" });
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetLogs()
    {
        var staffId = await _userService.GetCurrentStaffIdAsync();
        if (staffId == null) return Unauthorized(new { error = "Staff profile not found" });

        var assignments = await _assignmentService.GetTodayAssignmentsAsync(staffId.ToString());
        var logs = new
        {
            date = DateOnly.FromDateTime(DateTime.Today),
            assignments = assignments.Select(a => new
            {
                a.Id,
                a.Status,
                a.Note,
                last = LastLog(a),
                logs = a.Logs.Select(l => new
                {
                    l.Id,
                    l.Timestamp,
                    l.EventType,
                    l.Lat,
                    l.Lng
                })
            })
        };
        return Ok(logs);
    }

    private object? LastLog(DailyAssignment a)
    {
        var last = a.Logs?.OrderByDescending(l => l.Timestamp).FirstOrDefault();
        return last == null ? (object?)null : new
        {
            Id = last.Id,
            Timestamp = last.Timestamp,
            EventType = last.EventType,
            Lat = last.Lat,
            Lng = last.Lng
        };
    }

    private async Task BroadcastUpdateAsync()
    {
        await _hub.Clients.All.SendAsync("StatusUpdated", new { success = true });
    }
}
