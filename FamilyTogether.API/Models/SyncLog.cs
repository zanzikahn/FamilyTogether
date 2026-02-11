using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FamilyTogether.API.Models
{
    [Table("sync_logs")]
    public class SyncLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid? UserId { get; set; }

        public Guid? FamilyId { get; set; }

        public DateTime SyncTimestamp { get; set; } = DateTime.UtcNow;

        public int ChangesUploaded { get; set; } = 0;

        public int ChangesDownloaded { get; set; } = 0;

        public int ConflictsResolved { get; set; } = 0;

        public string[]? Errors { get; set; }

        [MaxLength(20)]
        public string? ClientType { get; set; } // spa, wpf, api

        [MaxLength(50)]
        public string? ClientVersion { get; set; }
    }
}
