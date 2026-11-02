using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StaffTracker.Api.Services;

namespace StaffTracker.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;
    private readonly ILogger<DashboardController> _log;

    public DashboardController(IAssignmentService assignmentService, ILogger<DashboardController> log)
    {
        _assignmentService = assignmentService; _log = log;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<object>> GetSummary()
    {
        var date = DateOnly.FromDateTime(DateTime.Today);
        var summary = await _assignmentService.GetSummaryAsync(date);
        var assignments = await _assignmentService.GetTodayAssignmentsAsync(null);
        return Ok(new
        {
            date,
            summary,
            assignments = assignments.Select(a => new
            {
                a.Id, a.StaffId, a.Staff?.DisplayName, a.Staff?.EmployeeNumber,
                a.LocationId, a.Location?.Name, a.Location?.Address,
                a.Status, a.Note, a.CheckedInAt, a.CheckedOutAt
            })
        });
    }
}
