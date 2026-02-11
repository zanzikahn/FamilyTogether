using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FamilyTogether.API.DTOs.Requests;
using FamilyTogether.API.Services;

namespace FamilyTogether.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// Register a new user, create a family, and return auth tokens
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
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

                _logger.LogInformation("Registration request for email: {Email}", request.Email);

                var response = await _authService.RegisterAsync(request);

                return Ok(new
                {
                    success = true,
                    data = response,
                    message = "Registration successful. Welcome to FamilyTogether!",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Registration failed for email: {Email}", request.Email);
                return BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "REGISTRATION_FAILED",
                        message = ex.Message
                    },
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during registration");
                return StatusCode(500, new
                {
                    success = false,
                    error = new
                    {
                        code = "INTERNAL_ERROR",
                        message = "An unexpected error occurred during registration"
                    },
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Login with email and password
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
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

                _logger.LogInformation("Login request for email: {Email}", request.Email);

                var response = await _authService.LoginAsync(request);

                return Ok(new
                {
                    success = true,
                    data = response,
                    message = "Login successful. Welcome back!",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Login failed for email: {Email} - {Message}", request.Email, ex.Message);
                return Unauthorized(new
                {
                    success = false,
                    error = new
                    {
                        code = "UNAUTHORIZED",
                        message = "Invalid email or password"
                    },
                    timestamp = DateTime.UtcNow
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Login failed for email: {Email}", request.Email);
                return BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "LOGIN_FAILED",
                        message = ex.Message
                    },
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during login");
                return StatusCode(500, new
                {
                    success = false,
                    error = new
                    {
                        code = "INTERNAL_ERROR",
                        message = "An unexpected error occurred during login"
                    },
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Logout the current user
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var authHeader = Request.Headers["Authorization"].ToString();
                var token = authHeader.Replace("Bearer ", "");

                var success = await _authService.LogoutAsync(token);

                if (success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Logged out successfully",
                        timestamp = DateTime.UtcNow
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "LOGOUT_FAILED",
                        message = "Logout failed"
                    },
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, new
                {
                    success = false,
                    error = new
                    {
                        code = "INTERNAL_ERROR",
                        message = "An unexpected error occurred during logout"
                    },
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Get current user's profile
        /// </summary>
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                               ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        error = new
                        {
                            code = "UNAUTHORIZED",
                            message = "Invalid user ID in token"
                        },
                        timestamp = DateTime.UtcNow
                    });
                }

                var profile = await _authService.GetUserProfileAsync(userId);

                if (profile == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        error = new
                        {
                            code = "NOT_FOUND",
                            message = "User profile not found"
                        },
                        timestamp = DateTime.UtcNow
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = profile,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user profile");
                return StatusCode(500, new
                {
                    success = false,
                    error = new
                    {
                        code = "INTERNAL_ERROR",
                        message = "An unexpected error occurred"
                    },
                    timestamp = DateTime.UtcNow
                });
            }
        }
    }
}
