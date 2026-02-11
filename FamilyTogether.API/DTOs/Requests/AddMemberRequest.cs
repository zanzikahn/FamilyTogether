using System.ComponentModel.DataAnnotations;

namespace FamilyTogether.API.DTOs.Requests
{
    public class AddMemberRequest
    {
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "child"; // parent, child, admin

        [MaxLength(10)]
        public string? Avatar { get; set; }

        public bool RequiresApproval { get; set; } = true;

        public Guid? ParentId { get; set; }

        public Guid? UserId { get; set; } // Optional: link to existing auth user
    }
}
