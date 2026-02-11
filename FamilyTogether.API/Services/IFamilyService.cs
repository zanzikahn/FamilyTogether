using FamilyTogether.API.DTOs.Requests;
using FamilyTogether.API.DTOs.Responses;

namespace FamilyTogether.API.Services
{
    public interface IFamilyService
    {
        Task<List<FamilyResponse>> GetUserFamiliesAsync(Guid userId);
        Task<FamilyResponse?> GetFamilyByIdAsync(Guid familyId, Guid userId);
        Task<FamilyResponse> CreateFamilyAsync(CreateFamilyRequest request, Guid userId, string userName);
        Task<MemberSummary> AddFamilyMemberAsync(Guid familyId, AddMemberRequest request, Guid userId);
        Task<bool> IsUserFamilyMemberAsync(Guid familyId, Guid userId);
    }
}
