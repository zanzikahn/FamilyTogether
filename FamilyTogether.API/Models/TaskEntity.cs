using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FamilyTogether.API.Models
{
    [Table("tasks")]
    public class TaskEntity : BaseEntity
    {
        [Required]
        public Guid FamilyId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public int Points { get; set; }

        [Required]
        public Guid AssignedTo { get; set; }

        [Required]
        public Guid CreatedBy { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "pending"; // pending, in_progress, awaiting_approval, approved, rejected

        public bool IsRecurring { get; set; } = false;

        [MaxLength(50)]
        public string? RecurrencePattern { get; set; } // daily, weekly, monthly

        public int? RecurrenceDay { get; set; }

        public DateTime? LastGeneratedAt { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime? CompletedAt { get; set; }

        public Guid? CompletedBy { get; set; }

        public string? CompletionNote { get; set; }

        [MaxLength(500)]
        public string? CompletionPhotoUrl { get; set; }

        public DateTime? ReviewedAt { get; set; }

        public Guid? ReviewedBy { get; set; }

        public string? ReviewNote { get; set; }

        public int BonusPoints { get; set; } = 0;

        public string? BonusReason { get; set; }

        // Navigation properties
        public virtual Family? Family { get; set; }
    }
}
