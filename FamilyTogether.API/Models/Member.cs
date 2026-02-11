using System.ComponentModel.DataAnnotations;

namespace FamilyTogether.API.Models
{
    public class Member : BaseEntity
    {
        [Required]
        public Guid FamilyId { get; set; }

        public Guid? UserId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "child"; // parent, child, admin

        [MaxLength(10)]
        public string? Avatar { get; set; }

        public int PointsBalance { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public bool RequiresApproval { get; set; } = true;

        public Guid? ParentId { get; set; }

        // Navigation properties
        public virtual Family? Family { get; set; }
        public virtual Member? Parent { get; set; }
    }
}
