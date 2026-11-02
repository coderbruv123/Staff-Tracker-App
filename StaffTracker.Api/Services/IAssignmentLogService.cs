using Microsoft.EntityFrameworkCore;
using StaffTracker.Api.Data;

namespace StaffTracker.Api.Services;

public interface IAssignmentLogService
{
    Task<List<CheckInLog>> GetLogsAsync(int assignmentId);
}

public class AssignmentLogService : IAssignmentLogService
{
    private readonly StaffTrackerDbContext _ctx;

    public AssignmentLogService(StaffTrackerDbContext ctx) => _ctx = ctx;

    public Task<List<CheckInLog>> GetLogsAsync(int assignmentId) =>
        _ctx.CheckInLogs.Where(c => c.AssignmentId == assignmentId).OrderBy(c => c.Timestamp).ToListAsync();
}
