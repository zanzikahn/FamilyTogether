using System.ComponentModel.DataAnnotations;

namespace FamilyTogether.API.DTOs.Requests
{
    public class CreateFamilyRequest
    {
        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;
    }
}
