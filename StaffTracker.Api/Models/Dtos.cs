namespace StaffTracker.Api.Models;

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? RoleHint { get; set; }
}

public class CreateStaffDto
{
    public string EmployeeNumber { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Department { get; set; }
}

public class CreateLocationDto
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class CreateAssignmentDto
{
    public int StaffId { get; set; }
    public int LocationId { get; set; }
    public DateOnly? Date { get; set; } = null; // null = today
}

public class StatusUpdateDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class CheckInDto
{
    public string? Lat { get; set; }
    public string? Lng { get; set; }
}
