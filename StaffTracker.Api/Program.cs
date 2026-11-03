using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using StaffTracker.Api.Data;
using StaffTracker.Api.Hubs;
using StaffTracker.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- DbContext & Identity ----
builder.Services.AddDbContext<StaffTrackerDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=stafftracker.db;"));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.SignIn.RequireConfirmedAccount = false;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<StaffTrackerDbContext>()
.AddDefaultTokenProviders();

// ---- Controllers ----
builder.Services.AddControllers();

// ---- SignalR ----
builder.Services.AddSignalR();

// ---- CORS ----
builder.Services.AddCors(options =>
{
    // The frontend dev server lives at http://localhost:5173. The proxy there
    // forwards /api -> the backend, but the browser still treats /api calls as
    // same-origin; still, allowCredentials must name the origin explicitly
    // (never '*') so cookies are honored.
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173").AllowCredentials().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<IDataSeed, DataSeed>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAssignmentService, AssignmentService>();
builder.Services.AddScoped<ICheckInService, CheckInService>();
builder.Services.AddScoped<IAssignmentLogService, AssignmentLogService>();

var app = builder.Build();

// ---- Migration / seed ----
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<StaffTrackerDbContext>();
    ctx.Database.EnsureCreated();
    var seeder = scope.ServiceProvider.GetRequiredService<IDataSeed>();
    seeder.SeedAsync().GetAwaiter().GetResult();
}

// ---- Middleware ----
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<StatusHub>("/hubs/status");

app.MapGet("/", () => Results.Ok(new { status = "StaffTracker API running", timestamp = DateTime.UtcNow.ToString("o") }));

app.Run();
