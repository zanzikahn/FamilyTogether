using System.ComponentModel.DataAnnotations;

namespace FamilyTogether.API.Models
{
    public class Family : BaseEntity
    {
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public Guid CreatedBy { get; set; }

        // Navigation properties
        public virtual ICollection<Member>? Members { get; set; }
        public virtual ICollection<TaskEntity>? Tasks { get; set; }
    }
}
