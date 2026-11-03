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
    private const double EarthRadiusMeters = 6371000.0;
    private const double MaxCheckInDistanceMeters = 500.0;

    public CheckInService(StaffTrackerDbContext ctx) => _ctx = ctx;

    public async Task<CheckInLog> CheckInAsync(int assignmentId, string? lat = null, string? lng = null)
    {
        var a = await _ctx.DailyAssignments
            .Include(a => a.Location)
            .Include(a => a.Logs)
            .FirstOrDefaultAsync(a => a.Id == assignmentId);
        if (a == null) throw new Exception("Assignment not found");
        if (a.Status == "Reached")
        {
            a.Status = "InProgress";
            a.CheckedInAt = DateTime.Now;
        }

        // Geo-fence validation: the provided check-in coordinates must fall within
        // the assigned location's area.
        if (!string.IsNullOrEmpty(lat) && !string.IsNullOrEmpty(lng))
        {
            if (!double.TryParse(lat, out var checkLat) || !double.TryParse(lng, out var checkLng))
            {
                throw new Exception("Check-in coordinates could not be parsed.");
            }
            if (a.Location != null && a.Location.Latitude.HasValue && a.Location.Longitude.HasValue)
            {
                if (!IsWithinLocation(checkLat, checkLng, a.Location.Latitude.Value, a.Location.Longitude.Value))
                {
                    throw new Exception("Check-in coordinates are outside the assigned location's area.");
                }
            }
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

    private bool IsWithinLocation(double checkLat, double checkLng, double locationLat, double locationLng)
    {
        var dLat = Math.Abs(checkLat - locationLat) * Math.PI / 180.0 * EarthRadiusMeters;
        var dLng = Math.Abs(checkLng - locationLng) * Math.PI / 180.0 * EarthRadiusMeters * Math.Cos(locationLat * Math.PI / 180.0);
        var distance = Math.Sqrt(dLat * dLat + dLng * dLng);
        return distance <= MaxCheckInDistanceMeters;
    }
}
