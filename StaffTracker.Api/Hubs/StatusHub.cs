using Microsoft.AspNetCore.SignalR;
using StaffTracker.Api.Services;

namespace StaffTracker.Api.Hubs;

public class StatusHub : Hub
{
    public Task SendStatusUpdate()
    {
        return Clients.All.SendAsync("StatusUpdated", new { success = true, message = "Status refreshed" });
    }
}
