# FamilyTogether Development Initiation Prompt

## Project Context

You are initiating autonomous development of **FamilyTogether**, a local-first SaaS platform with comprehensive documentation already in place. Your task is to systematically build the entire project from foundation to production deployment.

## Project Location
```
C:\Users\Zanzi\TOOLS\SaaS(SoftwareAsAService)
```

## Primary Reference Document
**Read CLAUDE.md FIRST** - This is your primary developer reference containing:
- Essential bash commands
- Code style rules
- Testing instructions
- Architectural decisions
- Common gotchas
- Critical DO/DON'T rules

## Complete Documentation Available

### Architecture & Requirements
1. **README_MASTER.md** - Project overview and navigation
2. **PRD_FamilyTogether_LocalFirst_SaaS.md** - Complete product requirements
3. **Technical_Architecture_Document.md** - System architecture
4. **Database_Schema_Design.md** - All database schemas
5. **API_Specification.md** - All 24 API endpoints

### Implementation Guides
6. **Code_Scaffolding_Templates.md** - Starter code for all components
7. **Code_Examples_Practical.md** - Working code examples
8. **Environment_Configuration_Templates.md** - Environment setup
9. **Error_Handling_Logging_Standards.md** - Error handling patterns
10. **Development_Setup_Guide.md** - Development environment setup

### Testing & Deployment
11. **Testing_Strategy_Document.md** - Comprehensive testing approach
12. **CICD_Pipeline_Configuration.md** - GitHub Actions workflows
13. **Deployment_Checklists_Scripts.md** - Deployment procedures
14. **Security_Checklist.md** - Security requirements

### Planning
15. **Implementation_Roadmap.md** - 6-week development timeline

---

## Your Mission

Build the complete FamilyTogether platform following the 6-week implementation roadmap while maintaining detailed tracking of all work completed.

---

## Mandatory Tracking Requirements

### 1. CHANGELOG.md (REQUIRED)
**Location**: `C:\Users\Zanzi\TOOLS\SaaS(SoftwareAsAService)\CHANGELOG.md`

You MUST maintain a comprehensive changelog following this format:

```markdown
# FamilyTogether - Development Changelog

## Format
All notable changes to this project will be documented in this file.

Format: [Date] - [Phase] - [Component] - [Action]

---

## [2026-02-10] - Phase 1 - Foundation

### Supabase Setup
- [COMPLETED] Created Supabase project: [project-id]
- [COMPLETED] Ran database migrations from Database_Schema_Design.md
- [COMPLETED] Verified all tables created: families, members, tasks, etc.
- [COMPLETED] Configured Row Level Security policies
- [COMPLETED] Tested authentication endpoints

### API Project
- [IN PROGRESS] Created ASP.NET Core 6.0 Web API project
- [COMPLETED] Installed required NuGet packages
- [PENDING] Implemented base controllers
...
```

**Update CHANGELOG.md**:
- After completing each significant task
- Before moving to the next component
- When encountering and resolving blockers
- At the end of each development session

### 2. PROJECT_STATE.md (REQUIRED)
**Location**: `C:\Users\Zanzi\TOOLS\SaaS(SoftwareAsAService)\PROJECT_STATE.md`

You MUST maintain a current state document:

```markdown
# FamilyTogether - Current Project State

**Last Updated**: [Date and Time]
**Current Phase**: [Phase Number and Name]
**Overall Progress**: [X]%

---

## Phase Completion Status

- [✅] Phase 1: Foundation (100%)
- [🔄] Phase 2: SPA Development (45%)
- [⏳] Phase 3: WPF Development (0%)
- [⏳] Phase 4: Backend & Sync (0%)
- [⏳] Phase 5: Testing (0%)
- [⏳] Phase 6: Launch (0%)

---

## Current Work

**Component**: [e.g., SPA - IndexedDB Integration]
**Status**: [In Progress / Blocked / Complete]
**Started**: [Date]
**Expected Completion**: [Date]

### What's Working
- [List all completed and functional features]

### What's Not Working
- [List any broken features or blockers]

### Next Steps
1. [Specific next task]
2. [Following task]
3. [Then this task]

---

## Infrastructure Status

### Supabase
- **Status**: ✅ Configured
- **URL**: [project-url]
- **Database**: ✅ Migrations complete
- **Auth**: ✅ Configured
- **RLS**: ✅ Policies active

### Railway (API)
- **Status**: [Not Started / In Progress / Deployed]
- **URL**: [deployment-url]
- **Last Deploy**: [date]
- **Health Check**: [Pass/Fail]

### Netlify (SPA)
- **Status**: [Not Started / In Progress / Deployed]
- **URL**: [deployment-url]
- **Last Deploy**: [date]

---

## Testing Status

| Component | Unit Tests | Integration Tests | E2E Tests | Coverage |
|-----------|-----------|-------------------|-----------|----------|
| API       | X/Y       | X/Y              | X/Y       | XX%      |
| SPA       | X/Y       | X/Y              | X/Y       | XX%      |
| WPF       | X/Y       | X/Y              | X/Y       | XX%      |

---

## Known Issues

### Critical
- [None / List critical blockers]

### High Priority
- [None / List high priority issues]

### Medium Priority
- [None / List medium priority issues]

---

## Environment Variables Status

- [✅] API .env configured
- [✅] SPA .env configured
- [⏳] WPF settings configured
- [✅] Railway environment variables set
- [✅] Netlify environment variables set

---

## Git Repository Status

- **Branch**: [current branch]
- **Commits**: [number]
- **Last Commit**: [commit message]
- **Untracked Files**: [count]
- **Modified Files**: [count]

---

## Deployment URLs

- **API (Railway)**: [url or "Not deployed"]
- **SPA (Netlify)**: [url or "Not deployed"]
- **Supabase Studio**: [url]

---

## Recent Decisions Made

- [Date]: [Decision made and rationale]
- [Date]: [Decision made and rationale]

---

## Questions / Blockers for User

- [None / List any questions or blockers requiring user input]
```

**Update PROJECT_STATE.md**:
- At the start of each development session
- After completing each phase
- When switching between components
- When encountering blockers
- At the end of each development session

### 3. Use TodoWrite Tool Continuously

You MUST use the TodoWrite tool to track granular tasks:

- Create todos at the start of each phase
- Mark tasks as `in_progress` when starting
- Mark tasks as `completed` immediately after finishing
- Add new todos as you discover additional work
- Only ONE task should be `in_progress` at a time

---

## Development Workflow

### Phase-by-Phase Approach

Follow the Implementation_Roadmap.md strictly. For EACH phase:

#### Before Starting a Phase

1. **Read PROJECT_STATE.md** to understand current state
2. **Read CHANGELOG.md** to review what's been done
3. **Create TodoWrite list** for all tasks in this phase
4. **Update PROJECT_STATE.md** with phase start
5. **Reference CLAUDE.md** for phase-specific gotchas

#### During a Phase

1. **Work on ONE task at a time**
2. **Mark todo as `in_progress`** before starting
3. **Follow code examples** from Code_Examples_Practical.md
4. **Follow code scaffolding** from Code_Scaffolding_Templates.md
5. **Run tests immediately** after implementing features
6. **Fix failing tests before moving on**
7. **Mark todo as `completed`** immediately after finishing
8. **Update CHANGELOG.md** with what you completed
9. **Commit frequently** with descriptive messages following CLAUDE.md conventions

#### After Completing a Phase

1. **Run all tests** for the component
2. **Update PROJECT_STATE.md** with phase completion
3. **Update CHANGELOG.md** with phase summary
4. **Mark all phase todos as completed**
5. **Run deployment** if applicable
6. **Verify deployment health checks**
7. **Document any deviations** from the plan
8. **Ask user for approval** before proceeding to next phase

---

## Critical Rules (From CLAUDE.md)

### DO
✅ Save to local database FIRST (IndexedDB/SQLite), then sync
✅ Update UI immediately after local save
✅ Queue all changes for background sync
✅ Handle offline scenarios in every feature
✅ Use Last-Write-Wins for conflicts (timestamp-based)
✅ Test offline functionality for every feature
✅ Follow Repository Pattern for data access
✅ Use optimistic updates everywhere
✅ Maintain 80%+ code coverage
✅ Run tests before committing

### DON'T
❌ Wait for API responses before updating UI (except auth)
❌ Block user actions on network calls
❌ Assume network connectivity
❌ Skip error handling
❌ Commit without testing
❌ Modify database schemas without updating all three databases
❌ Skip security checks (authorization, RLS, input validation)
❌ Deploy without running the deployment checklist
❌ Skip changelog updates
❌ Invent new features not in the PRD

---

## Required Tools & Accounts

Before starting Phase 1, verify you can access:

### Free Tier Services (REQUIRED)
- **Supabase**: PostgreSQL database + Auth (500MB free)
- **Railway**: API hosting ($5 credit/month free)
- **Netlify**: SPA hosting (100GB bandwidth free)
- **GitHub**: Repository and Actions CI/CD

### Development Tools
- **.NET 6.0 SDK**: For API and WPF development
- **Node.js**: For SPA development and build tools
- **Git**: Version control

---

## Phase 1: Foundation (Week 1) - START HERE

### Phase 1 Objectives
1. Set up Supabase database with all tables
2. Create and configure ASP.NET Core API project
3. Deploy API to Railway
4. Verify health checks and authentication

### Phase 1 Tasks

#### Task 1.1: Supabase Database Setup
- [ ] Create free Supabase project at https://supabase.com
- [ ] Copy database connection strings
- [ ] Run SQL migrations from Database_Schema_Design.md (Section 2)
- [ ] Verify all 8 tables created: families, members, tasks, calendar_events, expenses, shopping_items, notes, files
- [ ] Configure Row Level Security policies (Section 3 of Database_Schema_Design.md)
- [ ] Test Supabase Auth with test user registration
- [ ] Update CHANGELOG.md
- [ ] Update PROJECT_STATE.md with Supabase URLs

**Success Criteria**:
- All tables visible in Supabase Studio
- RLS policies active
- Test user can register and login
- CHANGELOG.md updated
- PROJECT_STATE.md shows Supabase status as ✅

#### Task 1.2: API Project Creation
- [ ] Create ASP.NET Core 6.0 Web API project
- [ ] Install NuGet packages from Code_Scaffolding_Templates.md
- [ ] Implement folder structure from Code_Scaffolding_Templates.md (Section 2)
- [ ] Create base entities from Code_Scaffolding_Templates.md (Section 2.3)
- [ ] Create base repository pattern from Code_Examples_Practical.md
- [ ] Configure Program.cs from Code_Scaffolding_Templates.md
- [ ] Set up appsettings.json from Environment_Configuration_Templates.md
- [ ] Configure .env file with Supabase credentials
- [ ] Implement global error handling middleware from Error_Handling_Logging_Standards.md
- [ ] Run project locally and verify Swagger UI works
- [ ] Update CHANGELOG.md
- [ ] Update PROJECT_STATE.md

**Success Criteria**:
- API runs locally on https://localhost:5001
- Swagger UI accessible
- Health check endpoint responds
- All base classes compiled
- CHANGELOG.md updated
- No compilation errors

#### Task 1.3: Authentication Implementation
- [ ] Create AuthController from Code_Examples_Practical.md (Section 2)
- [ ] Implement POST /api/auth/register endpoint
- [ ] Implement POST /api/auth/login endpoint
- [ ] Implement POST /api/auth/logout endpoint
- [ ] Configure JWT validation in Program.cs
- [ ] Add [Authorize] attribute testing
- [ ] Write unit tests for AuthController
- [ ] Test registration flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Update CHANGELOG.md
- [ ] Update PROJECT_STATE.md

**Success Criteria**:
- Can register new user via Swagger
- Can login and receive JWT token
- Protected endpoints return 401 without token
- Protected endpoints work with valid token
- Unit tests pass with 80%+ coverage
- CHANGELOG.md updated

#### Task 1.4: Core API Endpoints (Phase 1 Subset)
Implement these 4 endpoints to validate the pattern:
- [ ] GET /api/families (list families for user)
- [ ] POST /api/families (create family)
- [ ] GET /api/families/{id} (get single family)
- [ ] POST /api/families/{familyId}/members (add member)

Follow API_Specification.md for exact specifications.

- [ ] Implement FamiliesController
- [ ] Implement FamilyRepository following Repository Pattern
- [ ] Add authorization checks (user must be family member)
- [ ] Implement error handling
- [ ] Write unit tests for each endpoint
- [ ] Write integration tests
- [ ] Test all endpoints via Swagger
- [ ] Verify authorization works correctly
- [ ] Update CHANGELOG.md
- [ ] Update PROJECT_STATE.md

**Success Criteria**:
- All 4 endpoints work via Swagger
- Authorization prevents unauthorized access
- Tests pass with 80%+ coverage
- Error responses follow Error_Handling_Logging_Standards.md format
- CHANGELOG.md updated

#### Task 1.5: Railway Deployment
- [ ] Create Railway account
- [ ] Create new Railway project
- [ ] Configure environment variables from Environment_Configuration_Templates.md (Section 6)
- [ ] Follow deployment script from Deployment_Checklists_Scripts.md (Section 4.1)
- [ ] Deploy API to Railway
- [ ] Verify health check endpoint responds
- [ ] Test authentication endpoints on Railway URL
- [ ] Test family endpoints on Railway URL
- [ ] Configure custom domain (optional)
- [ ] Update CHANGELOG.md
- [ ] Update PROJECT_STATE.md with Railway URL

**Success Criteria**:
- API deployed and accessible at Railway URL
- Health check returns 200 OK
- Can register and login via Railway API
- All endpoints return expected responses
- CHANGELOG.md updated
- PROJECT_STATE.md shows Railway status as ✅ Deployed

#### Task 1.6: CI/CD Pipeline Setup
- [ ] Create GitHub repository (if not exists)
- [ ] Push all code to GitHub
- [ ] Create .github/workflows/api-cicd.yml from CICD_Pipeline_Configuration.md
- [ ] Configure GitHub secrets for Railway
- [ ] Trigger workflow and verify it passes
- [ ] Verify automatic deployment to Railway on main branch
- [ ] Update CHANGELOG.md
- [ ] Update PROJECT_STATE.md

**Success Criteria**:
- GitHub Actions workflow runs successfully
- Tests run automatically on push
- API deploys to Railway automatically on main branch merge
- CHANGELOG.md updated
- PROJECT_STATE.md shows CI/CD status as ✅

---

### Phase 1 Completion Checklist

Before moving to Phase 2, verify:

- [ ] Supabase database fully configured with all tables and RLS
- [ ] API project created with proper structure
- [ ] Authentication working (register, login, logout)
- [ ] 4 core endpoints implemented and tested
- [ ] API deployed to Railway and accessible
- [ ] CI/CD pipeline configured and working
- [ ] All tests passing with 80%+ coverage
- [ ] CHANGELOG.md fully updated with all Phase 1 work
- [ ] PROJECT_STATE.md shows Phase 1 as ✅ Complete
- [ ] No critical or high-priority issues in PROJECT_STATE.md

**Once Phase 1 checklist is complete, STOP and report to user before proceeding to Phase 2.**

---

## Subsequent Phases (Overview)

### Phase 2: SPA Development (Week 2)
- IndexedDB setup and wrapper
- Authentication UI and flows
- Family management UI
- Task management UI (offline-first)
- Sync implementation
- Deploy to Netlify

### Phase 3: WPF Development (Week 3)
- WPF project structure
- SQLite database with EF Core
- Authentication UI
- Family and task management
- Sync service implementation
- Packaging and distribution

### Phase 4: Backend & Sync (Week 4)
- Complete all 24 API endpoints
- Sync controller implementation
- Conflict resolution logic
- Background jobs for cleanup
- Complete API test coverage

### Phase 5: Testing (Week 5)
- Comprehensive E2E testing
- Offline scenario testing
- Performance testing
- Security audit
- Load testing

### Phase 6: Launch (Week 6)
- Final deployment to production
- Monitoring setup (Sentry)
- Documentation finalization
- Beta user testing
- Production launch

---

## Communication Protocol

### After Each Task
Provide a brief summary:
```
✅ Task 1.1 Complete: Supabase Database Setup
- Created Supabase project: [project-id]
- All 8 tables created and verified
- RLS policies configured
- Test user registered successfully
- CHANGELOG.md updated
- PROJECT_STATE.md updated
```

### After Each Phase
Provide a comprehensive summary:
```
🎉 Phase 1 Complete: Foundation

Summary:
- Supabase database fully configured
- API project created and structured
- Authentication implemented and tested
- 4 core endpoints working
- Deployed to Railway: [url]
- CI/CD pipeline configured

Metrics:
- Test Coverage: 85%
- API Endpoints: 4/24 complete
- Deployment Status: ✅ Success

Next Phase: Phase 2 - SPA Development
Awaiting user approval to proceed.
```

### When Encountering Blockers
Immediately report:
```
🚨 BLOCKER ENCOUNTERED

Phase: [Phase number]
Task: [Task name]
Issue: [Specific description]
Impact: [What this blocks]
Attempted Solutions: [What you tried]
Recommendation: [Suggested resolution]

Updated PROJECT_STATE.md with blocker details.
```

---

## Quality Gates

You MUST NOT proceed to the next phase until:

1. ✅ All tests passing (80%+ coverage)
2. ✅ All deployment health checks passing
3. ✅ CHANGELOG.md updated with complete phase details
4. ✅ PROJECT_STATE.md shows phase as complete
5. ✅ No critical or high-priority issues remain
6. ✅ Security checklist items completed for the phase
7. ✅ User approval received (for major phase transitions)

---

## Git Commit Conventions (From CLAUDE.md)

Follow these commit message patterns:

```
feat(api): implement family creation endpoint
fix(spa): resolve sync queue processing issue
test(wpf): add unit tests for SQLite repository
docs: update CHANGELOG with Phase 1 completion
deploy(railway): configure environment variables
refactor(api): improve error handling middleware
```

Commit frequently with atomic changes.

---

## Final Instructions

1. **Read CLAUDE.md thoroughly** before starting
2. **Read Implementation_Roadmap.md** to understand the full scope
3. **Start with Phase 1, Task 1.1** (Supabase Setup)
4. **Create CHANGELOG.md and PROJECT_STATE.md** immediately
5. **Use TodoWrite tool** to track all Phase 1 tasks
6. **Update tracking documents** after each task
7. **Run tests continuously** throughout development
8. **Commit frequently** with descriptive messages
9. **Report completion** of each task and phase
10. **Wait for user approval** before moving to new phases

---

## Success Definition

The project is complete when:

- All 6 phases completed per Implementation_Roadmap.md
- All 24 API endpoints implemented and tested
- SPA fully functional with offline support
- WPF application fully functional with offline support
- All components deployed to production
- Test coverage >80% across all components
- Security checklist fully completed
- All documentation updated
- CHANGELOG.md reflects entire development journey
- PROJECT_STATE.md shows 100% completion

---

## Your First Action

1. Read CLAUDE.md completely
2. Create CHANGELOG.md file
3. Create PROJECT_STATE.md file
4. Create TodoWrite list for Phase 1
5. Begin Task 1.1: Supabase Database Setup
6. Report progress after each task

---

**BEGIN AUTONOMOUS DEVELOPMENT NOW**

Start with Phase 1, Task 1.1. Good luck!
