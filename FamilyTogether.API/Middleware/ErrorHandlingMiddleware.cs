using System.Net;
using System.Text.Json;

namespace FamilyTogether.API.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var code = HttpStatusCode.InternalServerError;
            var errorCode = "INTERNAL_ERROR";

            if (exception is UnauthorizedAccessException)
            {
                code = HttpStatusCode.Unauthorized;
                errorCode = "UNAUTHORIZED";
            }
            else if (exception is ArgumentException || exception is InvalidOperationException)
            {
                code = HttpStatusCode.BadRequest;
                errorCode = "BAD_REQUEST";
            }
            else if (exception is KeyNotFoundException)
            {
                code = HttpStatusCode.NotFound;
                errorCode = "NOT_FOUND";
            }

            var result = JsonSerializer.Serialize(new
            {
                success = false,
                error = new
                {
                    code = errorCode,
                    message = exception.Message,
                    details = exception.InnerException?.Message
                },
                timestamp = DateTime.UtcNow
            }, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)code;

            return context.Response.WriteAsync(result);
        }
    }
}
