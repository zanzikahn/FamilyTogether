using FamilyTogether.API.Data;
using FamilyTogether.API.DTOs.Requests;
using FamilyTogether.API.DTOs.Responses;
using FamilyTogether.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FamilyTogether.API.Services
{
    public class FamilyService : IFamilyService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<FamilyService> _logger;

        public FamilyService(AppDbContext context, ILogger<FamilyService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<FamilyResponse>> GetUserFamiliesAsync(Guid userId)
        {
            try
            {
                _logger.LogInformation("Getting families for user: {UserId}", userId);

                var families = await _context.Members
                    .Where(m => m.UserId == userId && !m.IsDeleted)
                    .Include(m => m.Family)
                    .ThenInclude(f => f!.Members)
                    .Select(m => m.Family!)
                    .Distinct()
                    .ToListAsync();

                var responses = new List<FamilyResponse>();

                foreach (var family in families)
                {
                    var pendingTasksCount = await _context.Tasks
                        .CountAsync(t => t.FamilyId == family.Id
                                      && !t.IsDeleted
                                      && (t.Status == "pending" || t.Status == "in_progress"));

                    responses.Add(new FamilyResponse
                    {
                        Id = family.Id,
                        Name = family.Name,
                        CreatedBy = family.CreatedBy,
                        CreatedAt = family.CreatedAt,
                        Members = family.Members?
                            .Where(m => !m.IsDeleted)
                            .Select(m => new MemberSummary
                            {
                                Id = m.Id,
                                Name = m.Name,
                                Role = m.Role,
                                Avatar = m.Avatar,
                                PointsBalance = m.PointsBalance,
                                IsActive = m.IsActive
                            }).ToList() ?? new List<MemberSummary>(),
                        TotalMembers = family.Members?.Count(m => !m.IsDeleted) ?? 0,
                        PendingTasks = pendingTasksCount
                    });
                }

                _logger.LogInformation("Found {Count} families for user: {UserId}", responses.Count, userId);
                return responses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting families for user: {UserId}", userId);
                throw;
            }
        }

        public async Task<FamilyResponse?> GetFamilyByIdAsync(Guid familyId, Guid userId)
        {
            try
            {
                _logger.LogInformation("Getting family: {FamilyId} for user: {UserId}", familyId, userId);

                // Check if user is a member of this family
                var isMember = await IsUserFamilyMemberAsync(familyId, userId);
                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} is not a member of family {FamilyId}", userId, familyId);
                    return null;
                }

                var family = await _context.Families
                    .Include(f => f.Members)
                    .FirstOrDefaultAsync(f => f.Id == familyId && !f.IsDeleted);

                if (family == null)
                {
                    return null;
                }

                var pendingTasksCount = await _context.Tasks
                    .CountAsync(t => t.FamilyId == family.Id
                                  && !t.IsDeleted
                                  && (t.Status == "pending" || t.Status == "in_progress"));

                return new FamilyResponse
                {
                    Id = family.Id,
                    Name = family.Name,
                    CreatedBy = family.CreatedBy,
                    CreatedAt = family.CreatedAt,
                    Members = family.Members?
                        .Where(m => !m.IsDeleted)
                        .Select(m => new MemberSummary
                        {
                            Id = m.Id,
                            Name = m.Name,
                            Role = m.Role,
                            Avatar = m.Avatar,
                            PointsBalance = m.PointsBalance,
                            IsActive = m.IsActive
                        }).ToList() ?? new List<MemberSummary>(),
                    TotalMembers = family.Members?.Count(m => !m.IsDeleted) ?? 0,
                    PendingTasks = pendingTasksCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting family: {FamilyId}", familyId);
                throw;
            }
        }

        public async Task<FamilyResponse> CreateFamilyAsync(CreateFamilyRequest request, Guid userId, string userName)
        {
            try
            {
                _logger.LogInformation("Creating family for user: {UserId}", userId);

                // Create family
                var family = new Family
                {
                    Id = Guid.NewGuid(),
                    Name = request.Name,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    ChangeId = Guid.NewGuid(),
                    SyncVersion = 1,
                    IsDeleted = false
                };

                _context.Families.Add(family);

                // Create parent member for the creator
                var member = new Member
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    UserId = userId,
                    Name = userName,
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
                await _context.SaveChangesAsync();

                _logger.LogInformation("Family created: {FamilyId}", family.Id);

                return new FamilyResponse
                {
                    Id = family.Id,
                    Name = family.Name,
                    CreatedBy = family.CreatedBy,
                    CreatedAt = family.CreatedAt,
                    Members = new List<MemberSummary>
                    {
                        new MemberSummary
                        {
                            Id = member.Id,
                            Name = member.Name,
                            Role = member.Role,
                            Avatar = member.Avatar,
                            PointsBalance = member.PointsBalance,
                            IsActive = member.IsActive
                        }
                    },
                    TotalMembers = 1,
                    PendingTasks = 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating family");
                throw;
            }
        }

        public async Task<MemberSummary> AddFamilyMemberAsync(Guid familyId, AddMemberRequest request, Guid userId)
        {
            try
            {
                _logger.LogInformation("Adding member to family: {FamilyId} by user: {UserId}", familyId, userId);

                // Check if user is a parent/admin in this family
                var userMember = await _context.Members
                    .FirstOrDefaultAsync(m => m.FamilyId == familyId
                                           && m.UserId == userId
                                           && !m.IsDeleted
                                           && (m.Role == "parent" || m.Role == "admin"));

                if (userMember == null)
                {
                    throw new UnauthorizedAccessException("Only parents or admins can add family members");
                }

                // Validate role
                if (request.Role != "parent" && request.Role != "child" && request.Role != "admin")
                {
                    throw new ArgumentException("Role must be 'parent', 'child', or 'admin'");
                }

                // Create new member
                var member = new Member
                {
                    Id = Guid.NewGuid(),
                    FamilyId = familyId,
                    UserId = request.UserId,
                    Name = request.Name,
                    Role = request.Role,
                    Avatar = request.Avatar ?? (request.Role == "child" ? "👶" : "👤"),
                    PointsBalance = 0,
                    IsActive = true,
                    RequiresApproval = request.RequiresApproval,
                    ParentId = request.ParentId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    ChangeId = Guid.NewGuid(),
                    SyncVersion = 1,
                    IsDeleted = false
                };

                _context.Members.Add(member);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Member added: {MemberId} to family: {FamilyId}", member.Id, familyId);

                return new MemberSummary
                {
                    Id = member.Id,
                    Name = member.Name,
                    Role = member.Role,
                    Avatar = member.Avatar,
                    PointsBalance = member.PointsBalance,
                    IsActive = member.IsActive
                };
            }
            catch (UnauthorizedAccessException)
            {
                throw;
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding member to family: {FamilyId}", familyId);
                throw;
            }
        }

        public async Task<bool> IsUserFamilyMemberAsync(Guid familyId, Guid userId)
        {
            return await _context.Members
                .AnyAsync(m => m.FamilyId == familyId && m.UserId == userId && !m.IsDeleted);
        }
    }
}
