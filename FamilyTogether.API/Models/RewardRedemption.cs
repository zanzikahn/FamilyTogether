using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FamilyTogether.API.Models
{
    [Table("reward_redemptions")]
    public class RewardRedemption : BaseEntity
    {
        [Required]
        public Guid FamilyId { get; set; }

        [Required]
        public Guid RewardId { get; set; }

        [Required]
        public Guid MemberId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "pending"; // pending, approved, denied

        public DateTime RedeemedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        public Guid? ReviewedBy { get; set; }

        public string? ReviewNote { get; set; }

        [Required]
        public int PointsSpent { get; set; }

        // Navigation properties
        public virtual Family? Family { get; set; }
        public virtual Reward? Reward { get; set; }
        public virtual Member? Member { get; set; }
    }
}
