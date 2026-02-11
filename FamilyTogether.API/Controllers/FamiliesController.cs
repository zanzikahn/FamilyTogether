using Microsoft.AspNetCore.Mvc;
using FamilyTogether.API.DTOs.Requests;
using FamilyTogether.API.Services;

namespace FamilyTogether.API.Controllers
{
    public class FamiliesController : BaseController
    {
        private readonly IFamilyService _familyService;
        private readonly ILogger<FamiliesController> _logger;

        public FamiliesController(IFamilyService familyService, ILogger<FamiliesController> logger)
        {
            _familyService = familyService;
            _logger = logger;
        }

        /// <summary>
        /// Get all families for the authenticated user
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetFamilies()
        {
            try
            {
                var userId = GetUserId();
                var families = await _familyService.GetUserFamiliesAsync(userId);

                return SuccessResponse(families, $"Found {families.Count} familie(s)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting families");
                return ErrorResponse("Failed to retrieve families", 500);
            }
        }

        /// <summary>
        /// Get a single family by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetFamily(Guid id)
        {
            try
            {
                var userId = GetUserId();
                var family = await _familyService.GetFamilyByIdAsync(id, userId);

                if (family == null)
                {
                    return ErrorResponse("Family not found or access denied", 404);
                }

                return SuccessResponse(family);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting family: {FamilyId}", id);
                return ErrorResponse("Failed to retrieve family", 500);
            }
        }

        /// <summary>
        /// Create a new family
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateFamily([FromBody] CreateFamilyRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = new
                        {
                            code = "VALIDATION_ERROR",
                            message = "Invalid input data",
                            details = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                        },
                        timestamp = DateTime.UtcNow
                    });
                }

                var userId = GetUserId();
                var userEmail = GetUserEmail();

                // Use email as name if we can't get the name
                var userName = User.FindFirst("name")?.Value ?? userEmail.Split('@')[0];

                var family = await _familyService.CreateFamilyAsync(request, userId, userName);

                return SuccessResponse(family, "Family created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating family");
                return ErrorResponse("Failed to create family", 500);
            }
        }

        /// <summary>
        /// Add a member to a family
        /// </summary>
        [HttpPost("{familyId}/members")]
        public async Task<IActionResult> AddMember(Guid familyId, [FromBody] AddMemberRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = new
                        {
                            code = "VALIDATION_ERROR",
                            message = "Invalid input data",
                            details = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                        },
                        timestamp = DateTime.UtcNow
                    });
                }

                var userId = GetUserId();
                var member = await _familyService.AddFamilyMemberAsync(familyId, request, userId);

                return SuccessResponse(member, "Family member added successfully");
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized attempt to add member to family: {FamilyId}", familyId);
                return ErrorResponse(ex.Message, 403);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid member data for family: {FamilyId}", familyId);
                return ErrorResponse(ex.Message, 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding member to family: {FamilyId}", familyId);
                return ErrorResponse("Failed to add family member", 500);
            }
        }
    }
}
