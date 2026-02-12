using FamilyTogether.API.Data;
using FamilyTogether.API.DTOs.Requests;
using FamilyTogether.API.DTOs.Responses;
using FamilyTogether.API.Models;
using Microsoft.EntityFrameworkCore;
using Supabase.Gotrue;
using Supabase.Gotrue.Interfaces;

namespace FamilyTogether.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly Supabase.Client _supabase;
        private bool _supabaseInitialized = false;
        private readonly SemaphoreSlim _initLock = new SemaphoreSlim(1, 1);

        public AuthService(
            AppDbContext context,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;

            // Initialize Supabase client (but don't call InitializeAsync in constructor - prevents deadlock)
            var options = new Supabase.SupabaseOptions
            {
                AutoConnectRealtime = false
            };

            _supabase = new Supabase.Client(
                _configuration["Supabase:Url"]!,
                _configuration["Supabase:PublishableKey"]!,
                options
            );
        }

        private async Task EnsureSupabaseInitializedAsync()
        {
            if (_supabaseInitialized) return;

            await _initLock.WaitAsync();
            try
            {
                if (!_supabaseInitialized)
                {
                    await _supabase.InitializeAsync();
                    _supabaseInitialized = true;
                }
            }
            finally
            {
                _initLock.Release();
            }
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            try
            {
                await EnsureSupabaseInitializedAsync();
                _logger.LogInformation("Registering new user: {Email}", request.Email);

                // 1. Register user with Supabase Auth
                var signUpResponse = await _supabase.Auth.SignUp(request.Email, request.Password);

                if (signUpResponse.User == null)
                {
                    throw new InvalidOperationException("Failed to create user account");
                }

                var userId = Guid.Parse(signUpResponse.User.Id);
                _logger.LogInformation("User created in Supabase Auth: {UserId}", userId);

                // 2. Create family
                var family = new Family
                {
                    Id = Guid.NewGuid(),
                    Name = request.FamilyName,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    ChangeId = Guid.NewGuid(),
                    SyncVersion = 1,
                    IsDeleted = false
                };

                _context.Families.Add(family);
                _logger.LogInformation("Family created: {FamilyId}", family.Id);

                // 3. Create member (parent/admin)
                var member = new Member
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    UserId = userId,
                    Name = request.Name,
                    Role = "parent",
                    Avatar = "👤",
                    PointsBalance = 0,
                    IsActive = true,
                    RequiresApproval = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    ChangeId = Guid.NewGuid(),
                    SyncVersion = 1,
                    IsDeleted = false
                };

                _context.Members.Add(member);
                _logger.LogInformation("Member created: {MemberId}", member.Id);

                // 4. Save to database
                await _context.SaveChangesAsync();
                _logger.LogInformation("Registration completed for user: {Email}", request.Email);

                // 5. Return auth response
                return new AuthResponse
                {
                    AccessToken = signUpResponse.AccessToken ?? string.Empty,
                    RefreshToken = signUpResponse.RefreshToken ?? string.Empty,
                    ExpiresAt = DateTime.UtcNow.AddHours(1),
                    User = new UserData
                    {
                        Id = userId,
                        Email = request.Email,
                        Name = request.Name
                    },
                    Family = new FamilyData
                    {
                        Id = family.Id,
                        Name = family.Name,
                        CreatedAt = family.CreatedAt
                    },
                    Member = new MemberData
                    {
                        Id = member.Id,
                        Name = member.Name,
                        Role = member.Role,
                        PointsBalance = member.PointsBalance,
                        Avatar = member.Avatar
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Registration failed for email: {Email}", request.Email);
                throw new InvalidOperationException($"Registration failed: {ex.Message}", ex);
            }
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            try
            {
                await EnsureSupabaseInitializedAsync();
                _logger.LogInformation("Login attempt for user: {Email}", request.Email);

                // 1. Sign in with Supabase Auth
                var signInResponse = await _supabase.Auth.SignIn(request.Email, request.Password);

                if (signInResponse.User == null)
                {
                    throw new UnauthorizedAccessException("Invalid email or password");
                }

                var userId = Guid.Parse(signInResponse.User.Id);
                _logger.LogInformation("User authenticated: {UserId}", userId);

                // 2. Get user's member and family data
                var member = await _context.Members
                    .Include(m => m.Family)
                    .FirstOrDefaultAsync(m => m.UserId == userId && !m.IsDeleted);

                if (member == null)
                {
                    _logger.LogWarning("No member record found for user: {UserId}", userId);
                    throw new InvalidOperationException("User profile not found. Please contact support.");
                }

                // 3. Return auth response
                return new AuthResponse
                {
                    AccessToken = signInResponse.AccessToken ?? string.Empty,
                    RefreshToken = signInResponse.RefreshToken ?? string.Empty,
                    ExpiresAt = DateTime.UtcNow.AddHours(1),
                    User = new UserData
                    {
                        Id = userId,
                        Email = request.Email,
                        Name = member.Name
                    },
                    Family = member.Family != null ? new FamilyData
                    {
                        Id = member.Family.Id,
                        Name = member.Family.Name,
                        CreatedAt = member.Family.CreatedAt
                    } : null,
                    Member = new MemberData
                    {
                        Id = member.Id,
                        Name = member.Name,
                        Role = member.Role,
                        PointsBalance = member.PointsBalance,
                        Avatar = member.Avatar
                    }
                };
            }
            catch (UnauthorizedAccessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login failed for email: {Email}", request.Email);
                throw new InvalidOperationException($"Login failed: {ex.Message}", ex);
            }
        }

        public async Task<bool> LogoutAsync(string accessToken)
        {
            try
            {
                await EnsureSupabaseInitializedAsync();
                _logger.LogInformation("Logout request received");

                // Sign out from Supabase
                await _supabase.Auth.SignOut();

                _logger.LogInformation("User logged out successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Logout failed");
                return false;
            }
        }

        public async Task<UserData?> GetUserProfileAsync(Guid userId)
        {
            try
            {
                var member = await _context.Members
                    .FirstOrDefaultAsync(m => m.UserId == userId && !m.IsDeleted);

                if (member == null)
                {
                    return null;
                }

                return new UserData
                {
                    Id = userId,
                    Email = string.Empty, // We don't store email in Members table
                    Name = member.Name
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get user profile for: {UserId}", userId);
                return null;
            }
        }
    }
}
