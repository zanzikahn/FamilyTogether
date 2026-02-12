using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace FamilyTogether.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public DebugController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("info")]
    public IActionResult GetInfo()
    {
        var info = new
        {
            dotnetVersion = Environment.Version.ToString(),
            frameworkDescription = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
            assemblyVersion = Assembly.GetExecutingAssembly().GetName().Version?.ToString(),
            jwtDiscoveryUrl = _configuration["Supabase:JwtDiscoveryUrl"],
            jwtIssuer = _configuration["Jwt:Issuer"],
            jwtAudience = _configuration["Jwt:Audience"],
            identityModelVersion = typeof(Microsoft.IdentityModel.Tokens.SecurityToken).Assembly.GetName().Version?.ToString()
        };

        return Ok(info);
    }
}
