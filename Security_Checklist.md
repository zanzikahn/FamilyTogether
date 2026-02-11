# Security Checklist
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0
**Date**: February 10, 2026
**Purpose**: Comprehensive security guidelines and checklist

---

## Table of Contents
1. [Authentication & Authorization Security](#authentication--authorization-security)
2. [API Security](#api-security)
3. [Database Security](#database-security)
4. [Frontend Security](#frontend-security)
5. [Infrastructure Security](#infrastructure-security)
6. [Data Protection & Privacy](#data-protection--privacy)
7. [Security Testing](#security-testing)
8. [Incident Response](#incident-response)

---

## Authentication & Authorization Security

### Authentication Implementation Checklist

- [ ] **JWT Token Security**
  - [ ] Tokens stored securely (localStorage/secure app settings)
  - [ ] Token expiry configured (60 minutes recommended)
  - [ ] Token refresh mechanism implemented
  - [ ] Tokens invalidated on logout
  - [ ] No sensitive data in JWT payload

- [ ] **Password Security**
  - [ ] Minimum 8 characters required
  - [ ] At least 1 uppercase, 1 lowercase, 1 number required
  - [ ] Passwords hashed with bcrypt (Supabase handles this)
  - [ ] No password exposed in logs or error messages
  - [ ] Password reset functionality secure

- [ ] **Session Management**
  - [ ] Sessions expire after inactivity
  - [ ] Multiple concurrent sessions limited (optional)
  - [ ] Session tokens rotated on privilege change
  - [ ] Logout clears all session data

- [ ] **Multi-Factor Authentication (Future)**
  - [ ] Plan for MFA implementation
  - [ ] SMS/Email verification option
  - [ ] TOTP (Time-based One-Time Password) support

### Authorization Checklist

- [ ] **Role-Based Access Control (RBAC)**
  - [ ] Roles defined: parent, child, admin
  - [ ] Permissions enforced server-side
  - [ ] Authorization checked on every API request
  - [ ] No client-side only authorization

- [ ] **Resource Access Control**
  - [ ] Users can only access their family data
  - [ ] Family ID validated on every request
  - [ ] No direct object references without authorization
  - [ ] Supabase RLS policies enabled

- [ ] **API Endpoint Protection**
  - [ ] All endpoints require authentication (except register/login)
  - [ ] `[Authorize]` attribute on all controllers
  - [ ] Role-based endpoint restrictions
  - [ ] Rate limiting per user/IP

### Security Code Examples

**Validate User Access to Family**:
```csharp
private async Task<bool> UserHasAccessToFamily(Guid userId, Guid familyId)
{
    var member = await _context.Members
        .AnyAsync(m => m.UserId == userId && m.FamilyId == familyId && !m.IsDeleted);

    if (!member)
    {
        _logger.LogWarning("Unauthorized access attempt: User {UserId} to Family {FamilyId}",
            userId, familyId);
    }

    return member;
}
```

**Enforce Parent-Only Actions**:
```csharp
private async Task<bool> UserIsParentOrAdmin(Guid userId, Guid familyId)
{
    var member = await _context.Members
        .Where(m => m.UserId == userId && m.FamilyId == familyId && !m.IsDeleted)
        .FirstOrDefaultAsync();

    return member != null && (member.Role == "parent" || member.Role == "admin");
}
```

---

## API Security

### OWASP Top 10 Mitigation

#### 1. Injection Prevention

- [ ] **SQL Injection**
  - [ ] All database queries use parameterized queries
  - [ ] Entity Framework Core used (prevents SQL injection)
  - [ ] No raw SQL with user input
  - [ ] Input validation on all endpoints

```csharp
// GOOD: Parameterized query via EF Core
var tasks = await _context.Tasks
    .Where(t => t.FamilyId == familyId && t.Status == status)
    .ToListAsync();

// BAD: Never do this
// var query = $"SELECT * FROM tasks WHERE family_id = '{familyId}'";
```

#### 2. Broken Authentication

- [ ] **Implementation**
  - [ ] JWT tokens validated on every request
  - [ ] Supabase Auth handles authentication
  - [ ] Token expiry enforced
  - [ ] Failed login attempts logged
  - [ ] Account lockout after 5 failed attempts (Supabase feature)

#### 3. Sensitive Data Exposure

- [ ] **Data Protection**
  - [ ] HTTPS enforced on all connections
  - [ ] Passwords never logged
  - [ ] Sensitive data encrypted in transit
  - [ ] No secrets in error messages
  - [ ] Database connection strings secured

```csharp
// GOOD: Sanitize logs
_logger.LogInformation("User login attempt: {Email}", SanitizeEmail(email));

// BAD: Never log passwords
// _logger.LogInformation("Login: {Email}, {Password}", email, password);
```

#### 4. XML External Entities (XXE)

- [ ] Not applicable (using JSON, not XML)

#### 5. Broken Access Control

- [ ] **Authorization Checks**
  - [ ] Server-side authorization on all endpoints
  - [ ] Family ID validated
  - [ ] User role checked for privileged actions
  - [ ] No insecure direct object references

```csharp
[HttpPost("tasks/{taskId}/approve")]
[Authorize]
public async Task<IActionResult> ApproveTask(Guid taskId)
{
    var userId = GetUserId();

    // Verify user has permission
    var task = await _context.Tasks.FindAsync(taskId);
    if (task == null) return NotFound();

    // Check if user is parent/admin in the family
    if (!await UserIsParentOrAdmin(userId, task.FamilyId))
    {
        return Forbid();
    }

    // Proceed with approval...
}
```

#### 6. Security Misconfiguration

- [ ] **Configuration Security**
  - [ ] Default accounts disabled
  - [ ] Unnecessary features disabled
  - [ ] Error messages don't reveal system details
  - [ ] Security headers configured
  - [ ] CORS properly configured

```csharp
// Security Headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});
```

#### 7. Cross-Site Scripting (XSS)

- [ ] **XSS Prevention (SPA)**
  - [ ] All user input sanitized before display
  - [ ] Content Security Policy (CSP) configured
  - [ ] No `innerHTML` with user data
  - [ ] Use textContent instead of innerHTML

```javascript
// GOOD: Safe text insertion
element.textContent = userInput;

// BAD: Vulnerable to XSS
// element.innerHTML = userInput;

// If HTML needed, sanitize first
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

#### 8. Insecure Deserialization

- [ ] **JSON Deserialization**
  - [ ] System.Text.Json used (secure by default)
  - [ ] Type validation on deserialization
  - [ ] No polymorphic deserialization without validation

```csharp
// GOOD: Deserialize to known type
var request = JsonSerializer.Deserialize<SyncRequest>(json);

// Validate type
if (request == null || request.Changes == null)
{
    return BadRequest("Invalid request format");
}
```

#### 9. Using Components with Known Vulnerabilities

- [ ] **Dependency Management**
  - [ ] NuGet packages regularly updated
  - [ ] `dotnet list package --vulnerable` run regularly
  - [ ] Dependabot enabled on GitHub
  - [ ] Security advisories monitored

```bash
# Check for vulnerable packages
dotnet list package --vulnerable
dotnet list package --deprecated

# Update packages
dotnet add package <PackageName> --version <LatestVersion>
```

#### 10. Insufficient Logging & Monitoring

- [ ] **Logging & Monitoring**
  - [ ] All authentication attempts logged
  - [ ] Failed authorization logged
  - [ ] Sensitive operations logged (task approval, point transfers)
  - [ ] Errors logged with context
  - [ ] Monitoring alerts configured

```csharp
_logger.LogWarning(
    "Failed authorization: User {UserId} attempted to access Family {FamilyId}",
    userId, familyId
);

_logger.LogInformation(
    "Task approved: TaskId={TaskId}, ApprovedBy={UserId}, Points={Points}",
    taskId, userId, points
);
```

### Input Validation

- [ ] **Server-Side Validation**
  - [ ] All inputs validated (never trust client)
  - [ ] Type validation enforced
  - [ ] Length limits enforced
  - [ ] Range checks for numbers
  - [ ] Format validation (email, dates)

```csharp
public class CreateTaskValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(500)
            .Must(BeValidString).WithMessage("Invalid characters in title");

        RuleFor(x => x.Points)
            .GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(1000);

        RuleFor(x => x.AssignedTo)
            .NotEmpty()
            .Must(BeValidGuid);
    }

    private bool BeValidString(string input)
    {
        // Prevent script injection
        return !input.Contains('<') && !input.Contains('>');
    }

    private bool BeValidGuid(Guid guid)
    {
        return guid != Guid.Empty;
    }
}
```

### Rate Limiting

- [ ] **Rate Limit Configuration**
  - [ ] General: 100 requests/minute per IP
  - [ ] Auth endpoints: 5 requests/minute per IP
  - [ ] Sync endpoint: 2 requests/minute per user
  - [ ] Rate limit headers returned

```csharp
// Rate limiting middleware (using AspNetCoreRateLimit)
services.AddMemoryCache();
services.Configure<IpRateLimitOptions>(options =>
{
    options.GeneralRules = new List<RateLimitRule>
    {
        new RateLimitRule
        {
            Endpoint = "*",
            Limit = 100,
            Period = "1m"
        },
        new RateLimitRule
        {
            Endpoint = "*/api/auth/*",
            Limit = 5,
            Period = "1m"
        }
    };
});

services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
services.AddInMemoryRateLimiting();
```

---

## Database Security

### Supabase Security Checklist

- [ ] **Row Level Security (RLS)**
  - [ ] RLS enabled on all tables
  - [ ] Policies enforce family isolation
  - [ ] Users can only access own family data
  - [ ] Service role key secured (never exposed to client)

```sql
-- Example RLS Policy
CREATE POLICY "Users can only see their family tasks"
ON tasks FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = tasks.family_id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);
```

- [ ] **Database Connection Security**
  - [ ] Connection string stored in environment variables
  - [ ] SSL/TLS enforced for connections
  - [ ] Connection pooling configured
  - [ ] No database credentials in code

- [ ] **Data Encryption**
  - [ ] Data encrypted at rest (Supabase default)
  - [ ] Data encrypted in transit (HTTPS/TLS)
  - [ ] Sensitive fields additionally encrypted (if needed)

- [ ] **Backup & Recovery**
  - [ ] Automated backups enabled (Supabase Pro)
  - [ ] Backup retention policy defined
  - [ ] Recovery procedures documented
  - [ ] Backup restoration tested

---

## Frontend Security

### SPA Security Checklist

- [ ] **XSS Prevention**
  - [ ] All user input sanitized
  - [ ] No `eval()` or `Function()` with user input
  - [ ] Content Security Policy configured
  - [ ] No inline scripts or styles

```html
<!-- Content Security Policy -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://cdn.jsdelivr.net;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               connect-src 'self' https://*.supabase.co https://*.railway.app;">
```

- [ ] **CSRF Protection**
  - [ ] JWT tokens used (not cookies)
  - [ ] SameSite cookie attribute if using cookies
  - [ ] Origin header validated on server

- [ ] **Secure Storage**
  - [ ] No sensitive data in localStorage (except tokens)
  - [ ] Tokens cleared on logout
  - [ ] IndexedDB doesn't store passwords
  - [ ] Session data cleared on close

```javascript
// GOOD: Store token securely
localStorage.setItem('auth_token', token);

// BAD: Never store passwords
// localStorage.setItem('password', password);

// Clear on logout
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    // Clear IndexedDB if needed
    indexedDB.deleteDatabase('FamilyTogetherDB');
}
```

- [ ] **Dependency Security**
  - [ ] NPM packages regularly updated
  - [ ] `npm audit` run regularly
  - [ ] No known vulnerable dependencies
  - [ ] Minimal dependencies used

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Update packages
npm update
```

### WPF Security Checklist

- [ ] **Secure Storage**
  - [ ] Passwords not stored locally
  - [ ] Tokens encrypted if stored
  - [ ] SQLite database permissions restricted
  - [ ] App.config secured

```csharp
// Use Windows Data Protection API for sensitive data
using System.Security.Cryptography;

public static string EncryptString(string plainText)
{
    byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
    byte[] encryptedBytes = ProtectedData.Protect(
        plainBytes,
        null,
        DataProtectionScope.CurrentUser
    );
    return Convert.ToBase64String(encryptedBytes);
}

public static string DecryptString(string encryptedText)
{
    byte[] encryptedBytes = Convert.FromBase64String(encryptedText);
    byte[] plainBytes = ProtectedData.Unprotect(
        encryptedBytes,
        null,
        DataProtectionScope.CurrentUser
    );
    return Encoding.UTF8.GetString(plainBytes);
}
```

- [ ] **Code Signing**
  - [ ] Application signed with valid certificate
  - [ ] Signature verified on updates
  - [ ] Certificate renewed before expiry

- [ ] **Update Security**
  - [ ] Updates downloaded over HTTPS
  - [ ] Update signatures validated
  - [ ] User notified of updates
  - [ ] Automatic update option

---

## Infrastructure Security

### Hosting Security (Railway & Netlify)

- [ ] **SSL/TLS**
  - [ ] HTTPS enforced on all endpoints
  - [ ] TLS 1.2+ only
  - [ ] HTTP to HTTPS redirect enabled
  - [ ] Certificate auto-renewal configured

- [ ] **Environment Variables**
  - [ ] All secrets in environment variables
  - [ ] No secrets in code or config files
  - [ ] Environment variables not logged
  - [ ] Production secrets different from development

- [ ] **Network Security**
  - [ ] CORS configured properly
  - [ ] Only necessary ports exposed
  - [ ] DDoS protection enabled (Railway/Netlify)
  - [ ] IP whitelisting (if applicable)

- [ ] **Monitoring & Alerts**
  - [ ] Uptime monitoring enabled
  - [ ] Error tracking configured (Sentry)
  - [ ] Security alerts configured
  - [ ] Log aggregation set up

### CI/CD Security

- [ ] **GitHub Secrets**
  - [ ] All deployment secrets in GitHub Secrets
  - [ ] No secrets in workflow files
  - [ ] Secrets rotated regularly
  - [ ] Access to secrets limited

- [ ] **Build Security**
  - [ ] Dependency scanning in CI
  - [ ] Static analysis tools run
  - [ ] Security tests automated
  - [ ] Build artifacts secured

```yaml
# Security scanning in GitHub Actions
- name: Security Scan
  run: |
    dotnet list package --vulnerable
    dotnet list package --deprecated
    npm audit
```

---

## Data Protection & Privacy

### GDPR Compliance (if applicable)

- [ ] **User Rights**
  - [ ] Right to access data (export functionality)
  - [ ] Right to deletion (account deletion)
  - [ ] Right to rectification (edit profile)
  - [ ] Right to data portability (export)

- [ ] **Data Minimization**
  - [ ] Only collect necessary data
  - [ ] No excessive data retention
  - [ ] Data deleted when no longer needed
  - [ ] Audit trail for data access

- [ ] **Privacy Policy**
  - [ ] Privacy policy published
  - [ ] User consent obtained
  - [ ] Data processing documented
  - [ ] Third-party services disclosed

### Data Retention

- [ ] **Retention Policy**
  - [ ] Deleted records soft-deleted (for sync)
  - [ ] Hard deletion after 90 days
  - [ ] User data deleted on account closure
  - [ ] Backups follow retention policy

```sql
-- Cleanup job (run monthly)
DELETE FROM tasks
WHERE is_deleted = TRUE
AND updated_at < NOW() - INTERVAL '90 days';

DELETE FROM members
WHERE is_deleted = TRUE
AND updated_at < NOW() - INTERVAL '90 days';
```

---

## Security Testing

### Pre-Deployment Security Tests

- [ ] **Authentication Testing**
  - [ ] Invalid credentials rejected
  - [ ] Token expiry handled correctly
  - [ ] Logout clears session
  - [ ] Password complexity enforced

- [ ] **Authorization Testing**
  - [ ] Users cannot access other families
  - [ ] Children cannot perform parent actions
  - [ ] All endpoints require authentication
  - [ ] Direct object references protected

- [ ] **Input Validation Testing**
  - [ ] SQL injection attempts blocked
  - [ ] XSS attempts sanitized
  - [ ] Buffer overflow prevented
  - [ ] Invalid data types rejected

- [ ] **API Security Testing**
  - [ ] Rate limiting works
  - [ ] CORS configured correctly
  - [ ] Error messages don't leak info
  - [ ] File upload restrictions enforced

### Penetration Testing Checklist

- [ ] **Manual Testing**
  - [ ] Attempt SQL injection on all inputs
  - [ ] Attempt XSS on all text fields
  - [ ] Try accessing other users' data
  - [ ] Test privilege escalation
  - [ ] Attempt CSRF attacks
  - [ ] Test session fixation

- [ ] **Automated Scanning**
  - [ ] OWASP ZAP scan completed
  - [ ] Nmap port scan completed
  - [ ] Dependency vulnerability scan
  - [ ] SSL/TLS configuration tested

---

## Incident Response

### Security Incident Response Plan

#### 1. Detection
- [ ] Monitoring alerts configured
- [ ] Unusual activity detected
- [ ] User reports security issue
- [ ] Audit logs reviewed regularly

#### 2. Containment
```bash
# Immediate actions if breach detected:

# 1. Disable affected user accounts
# Via Supabase Dashboard → Authentication → Users → Disable

# 2. Rotate all secrets immediately
railway variables set SUPABASE_JWT_SECRET=new_secret
railway variables set DATABASE_CONNECTION_STRING=new_connection

# 3. Enable maintenance mode (if needed)
# Update SPA to show maintenance page

# 4. Review access logs
railway logs --tail 1000 | grep "ERROR\|UNAUTHORIZED"
```

#### 3. Investigation
- [ ] Identify attack vector
- [ ] Determine scope of breach
- [ ] Document timeline
- [ ] Preserve evidence

#### 4. Recovery
- [ ] Patch vulnerabilities
- [ ] Restore from clean backup
- [ ] Re-deploy services
- [ ] Verify systems secure

#### 5. Post-Incident
- [ ] Conduct post-mortem
- [ ] Update security measures
- [ ] Notify affected users (if required)
- [ ] Document lessons learned

### Contact Information

**Security Team** (update with your info):
- Security Lead: [email]
- DevOps: [email]
- On-Call: [phone]

**External Resources**:
- Supabase Support: https://supabase.com/support
- Railway Support: https://railway.app/help
- CERT: https://www.us-cert.gov/

---

## Security Audit Checklist

### Monthly Security Review

- [ ] Review access logs for anomalies
- [ ] Check for failed login attempts
- [ ] Review error logs for security issues
- [ ] Update dependencies
- [ ] Rotate credentials (quarterly)
- [ ] Review user permissions
- [ ] Test backup restoration
- [ ] Update security documentation

### Quarterly Security Audit

- [ ] Full penetration test
- [ ] Code security review
- [ ] Infrastructure audit
- [ ] Third-party service review
- [ ] Compliance check
- [ ] Incident response drill
- [ ] Security training for team

---

## Security Best Practices Summary

### Development
- Always validate input server-side
- Never trust client data
- Use parameterized queries
- Implement proper error handling
- Log security events
- Keep dependencies updated

### Deployment
- Use HTTPS everywhere
- Secure all secrets
- Enable rate limiting
- Configure security headers
- Monitor continuously
- Have rollback plan

### Operations
- Regular security audits
- Incident response ready
- Backup and test restores
- Update promptly
- Monitor logs
- User education

---

**END OF SECURITY CHECKLIST**

**Remember**: Security is an ongoing process, not a one-time task. Review and update this checklist regularly as threats evolve.
