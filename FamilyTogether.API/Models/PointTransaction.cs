using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FamilyTogether.API.Models
{
    [Table("point_transactions")]
    public class PointTransaction : BaseEntity
    {
        [Required]
        public Guid FamilyId { get; set; }

        [Required]
        public Guid MemberId { get; set; }

        [Required]
        public int Amount { get; set; }

        [Required]
        [MaxLength(50)]
        public string TransactionType { get; set; } = string.Empty; // task_completion, reward_redemption, manual_adjustment, bonus

        public Guid? ReferenceId { get; set; }

        [Required]
        public string Description { get; set; } = string.Empty;

        public Guid? CreatedBy { get; set; }

        // Navigation properties
        public virtual Family? Family { get; set; }
        public virtual Member? Member { get; set; }
    }
}
