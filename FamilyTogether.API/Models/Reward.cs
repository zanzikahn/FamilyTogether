using System.ComponentModel.DataAnnotations;

namespace FamilyTogether.API.Models
{
    public class Reward : BaseEntity
    {
        [Required]
        public Guid FamilyId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public int Cost { get; set; }

        [MaxLength(10)]
        public string? Icon { get; set; }

        public bool IsActive { get; set; } = true;

        public bool RequiresApproval { get; set; } = true;

        [Required]
        public Guid CreatedBy { get; set; }

        // Navigation properties
        public virtual Family? Family { get; set; }
    }
}
