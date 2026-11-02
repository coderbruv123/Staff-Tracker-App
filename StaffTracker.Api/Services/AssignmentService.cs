using Microsoft.EntityFrameworkCore;
using StaffTracker.Api.Data;

namespace StaffTracker.Api.Services;

public class AssignmentService : IAssignmentService
{
    private readonly StaffTrackerDbContext _ctx;

    public AssignmentService(StaffTrackerDbContext ctx) => _ctx = ctx;

    public async Task<List<DailyAssignment>> GetTodayAssignmentsAsync(string? staffId = null)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var q = _ctx.DailyAssignments
            .Include(a => a.Staff)
            .Include(a => a.Location)
            .Include(a => a.Logs)
            .Where(a => a.Date == today);
        if (!string.IsNullOrEmpty(staffId)) q = q.Where(a => a.StaffId == int.Parse(staffId));
        return await q.OrderBy(a => a.StaffId).ToListAsync();
    }

    public async Task<DailyAssignment?> GetAssignmentAsync(int id) =>
        await _ctx.DailyAssignments.Include(a => a.Staff).Include(a => a.Location).FirstOrDefaultAsync(a => a.Id == id);

    public async Task<DailyAssignment> CreateAssignmentAsync(int staffId, int locationId, DateOnly date)
    {
        var a = new DailyAssignment { StaffId = staffId, LocationId = locationId, Date = date, Status = "Pending" };
        _ctx.DailyAssignments.Add(a);
        await _ctx.SaveChangesAsync();
        return a;
    }

    public async Task<DailyAssignment> UpdateStatusAsync(int id, string status, string? note = null)
    {
        var a = await GetAssignmentAsync(id);
        if (a == null) throw new Exception("Assignment not found");
        a.Status = status;
        if (!string.IsNullOrEmpty(note)) a.Note = note;
        switch (status)
        {
            case "InProgress":
                a.CheckedInAt = DateTime.Now;
                break;
            case "Reached":
                a.CheckedInAt = a.CheckedInAt ?? DateTime.Now;
                break;
            case "Pending":
            case "NotReached":
                a.CheckedInAt = null;
                break;
        }
        _ctx.DailyAssignments.Update(a);
        await _ctx.SaveChangesAsync();
        return a;
    }

    public async Task<List<DailyAssignment>> GetHistoryAsync(int staffId)
    {
        return await _ctx.DailyAssignments
            .Include(a => a.Location)
            .Where(a => a.StaffId == staffId && a.Date < DateOnly.FromDateTime(DateTime.Today))
            .OrderByDescending(a => a.Date)
            .ToListAsync();
    }

    public async Task<DashboardSummary> GetSummaryAsync(DateOnly date)
    {
        var total = await _ctx.DailyAssignments.CountAsync(a => a.Date == date);
        return new DashboardSummary
        {
            Total = total,
            Reached = await _ctx.DailyAssignments.CountAsync(a => a.Date == date && a.Status == "Reached"),
            InProgress = await _ctx.DailyAssignments.CountAsync(a => a.Date == date && a.Status == "InProgress"),
            Pending = await _ctx.DailyAssignments.CountAsync(a => a.Date == date && a.Status == "Pending"),
            NotReached = await _ctx.DailyAssignments.CountAsync(a => a.Date == date && a.Status == "NotReached")
        };
    }
}
