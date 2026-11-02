using Microsoft.EntityFrameworkCore;
using StaffTracker.Api.Data;

namespace StaffTracker.Api.Services;

public interface IAssignmentService
{
    Task<List<DailyAssignment>> GetTodayAssignmentsAsync(string? staffId = null);
    Task<DailyAssignment?> GetAssignmentAsync(int id);
    Task<DailyAssignment> CreateAssignmentAsync(int staffId, int locationId, DateOnly date);
    Task<DailyAssignment> UpdateStatusAsync(int id, string status, string? note = null);
    Task<List<DailyAssignment>> GetHistoryAsync(int staffId);
    Task<DashboardSummary> GetSummaryAsync(DateOnly date);
}

public class DashboardSummary
{
    public int Total { get; set; }
    public int Reached { get; set; }
    public int InProgress { get; set; }
    public int Pending { get; set; }
    public int NotReached { get; set; }
}
