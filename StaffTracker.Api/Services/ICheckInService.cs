using Microsoft.EntityFrameworkCore;
using StaffTracker.Api.Data;

namespace StaffTracker.Api.Services;

public interface ICheckInService
{
    Task<CheckInLog> CheckInAsync(int assignmentId, string? lat = null, string? lng = null);
    Task CheckOutAsync(int assignmentId);
    Task<CheckInLog?> GetCheckInAsync(int assignmentId);
}

public class CheckInService : ICheckInService
{
    private readonly StaffTrackerDbContext _ctx;

    public CheckInService(StaffTrackerDbContext ctx) => _ctx = ctx;

    public async Task<CheckInLog> CheckInAsync(int assignmentId, string? lat = null, string? lng = null)
    {
        var a = await _ctx.DailyAssignments.Include(a => a.Logs).FirstOrDefaultAsync(a => a.Id == assignmentId);
        if (a == null) throw new Exception("Assignment not found");
        if (a.Status == "Reached")
        {
            a.Status = "InProgress";
            a.CheckedInAt = DateTime.Now;
        }
        var log = new CheckInLog { AssignmentId = a.Id, Timestamp = DateTime.Now, EventType = "CheckIn", Lat = lat, Lng = lng };
        a.Logs.Add(log);
        _ctx.DailyAssignments.Update(a);
        await _ctx.SaveChangesAsync();
        return log;
    }

    public async Task CheckOutAsync(int assignmentId)
    {
        var a = await _ctx.DailyAssignments.Include(a => a.Logs).FirstOrDefaultAsync(a => a.Id == assignmentId);
        if (a == null) throw new Exception("Assignment not found");
        a.CheckedOutAt = DateTime.Now;
        var log = new CheckInLog { AssignmentId = a.Id, Timestamp = DateTime.Now, EventType = "CheckOut" };
        a.Logs.Add(log);
        _ctx.DailyAssignments.Update(a);
        await _ctx.SaveChangesAsync();
    }

    public Task<CheckInLog?> GetCheckInAsync(int assignmentId) =>
        _ctx.CheckInLogs.FirstOrDefaultAsync(c => c.AssignmentId == assignmentId);
}
