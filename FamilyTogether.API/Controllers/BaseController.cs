using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FamilyTogether.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public abstract class BaseController : ControllerBase
    {
        protected Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user ID in token");
            }

            return userId;
        }

        protected string GetUserEmail()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value
                ?? User.FindFirst("email")?.Value
                ?? throw new UnauthorizedAccessException("Email not found in token");
        }

        protected IActionResult SuccessResponse<T>(T data, string? message = null)
        {
            return Ok(new
            {
                success = true,
                data = data,
                message = message,
                timestamp = DateTime.UtcNow
            });
        }

        protected IActionResult ErrorResponse(string message, int statusCode = 400)
        {
            return StatusCode(statusCode, new
            {
                success = false,
                error = new
                {
                    code = GetErrorCode(statusCode),
                    message = message
                },
                timestamp = DateTime.UtcNow
            });
        }

        private static string GetErrorCode(int statusCode)
        {
            return statusCode switch
            {
                400 => "BAD_REQUEST",
                401 => "UNAUTHORIZED",
                403 => "FORBIDDEN",
                404 => "NOT_FOUND",
                409 => "CONFLICT",
                500 => "INTERNAL_ERROR",
                _ => "UNKNOWN_ERROR"
            };
        }
    }
}
