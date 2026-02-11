namespace FamilyTogether.API.DTOs.Responses
{
    public class FamilyResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<MemberSummary> Members { get; set; } = new();
        public int TotalMembers { get; set; }
        public int PendingTasks { get; set; }
    }

    public class MemberSummary
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public int PointsBalance { get; set; }
        public bool IsActive { get; set; }
    }
}
