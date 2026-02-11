using FamilyTogether.API.DTOs.Requests;
using FamilyTogether.API.DTOs.Responses;

namespace FamilyTogether.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<bool> LogoutAsync(string accessToken);
        Task<UserData?> GetUserProfileAsync(Guid userId);
    }
}
