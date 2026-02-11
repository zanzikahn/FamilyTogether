using System.ComponentModel.DataAnnotations;

namespace FamilyTogether.API.Models
{
    public abstract class BaseEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public long LastModified { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        public bool IsDeleted { get; set; } = false;

        public Guid ChangeId { get; set; } = Guid.NewGuid();

        public int SyncVersion { get; set; } = 1;
    }
}
