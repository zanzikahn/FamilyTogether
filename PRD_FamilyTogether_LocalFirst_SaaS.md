# Product Requirements Document (PRD)
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0  
**Date**: February 10, 2026  
**Project Owner**: Zanzikahn  
**Status**: Pre-Development

---

## Executive Summary

FamilyTogether is a local-first SaaS platform designed to help families manage household tasks, track progress, and reward participation through a gamified points system. The platform will support both web-based (SPA) and desktop (WPF) applications, allowing families to work offline and sync their data when online.

### Key Value Propositions
- **Offline-First**: Apps work fully without internet connection
- **Multi-Platform**: Browser (SPA) and Windows Desktop (WPF) support
- **Cost-Effective**: $0/month startup costs with free tiers
- **Family-Focused**: Designed specifically for household task management
- **Gamified**: Points, rewards, and parent approval system

---

## Product Vision & Goals

### Vision Statement
To create the most accessible and reliable family task management platform that works seamlessly across devices, online or offline, empowering families to stay organized without dependency on cloud connectivity.

### Primary Goals
1. **Launch MVP in 6 weeks** with core task management functionality
2. **Achieve 100% offline functionality** for all primary features
3. **Maintain $0 monthly costs** until reaching 1,000 users
4. **Achieve <500ms sync time** for typical data payloads
5. **Support multi-device usage** with conflict resolution

### Success Criteria
- **User Retention**: 70%+ monthly active users after 3 months
- **Sync Success Rate**: >99% successful syncs
- **App Performance**: <100ms response time for local operations
- **Cost Efficiency**: <$0.05 per user at 10,000 users scale

---

## Target Users & Personas

### Primary Persona: Parent/Guardian
**Name**: Sarah (35), Working Mother of 2  
**Pain Points**:
- Needs kids to complete chores without constant reminders
- Wants accountability and progress tracking
- Often has spotty internet at home
- Needs solution that works when she's away

**Goals**:
- Assign and track household tasks
- Review and approve completed work
- Motivate children with reward system
- Access from phone, computer, or tablet

### Secondary Persona: Child/Teen
**Name**: Alex (12), Middle School Student  
**Pain Points**:
- Forgets assigned chores
- Wants recognition for completed tasks
- Motivated by rewards and gamification

**Goals**:
- See assigned tasks clearly
- Track earned points
- Redeem points for rewards
- Feel accomplished

### Tertiary Persona: Family Administrator
**Name**: David (40), Stay-at-Home Dad  
**Pain Points**:
- Manages household operations
- Coordinates multiple family members
- Needs reporting and insights

**Goals**:
- Manage family member accounts
- Create task templates
- Configure reward system
- View family statistics

---

## Feature Requirements

### 1. Core Features (MVP - Week 1-6)

#### 1.1 User Authentication & Management
**Priority**: P0 (Critical)

**Functional Requirements**:
- FR-AUTH-001: Users can register with email and password
- FR-AUTH-002: Users can log in with email/password
- FR-AUTH-003: Users can log out
- FR-AUTH-004: Parents can create child accounts (email optional)
- FR-AUTH-005: JWT tokens issued with 60-minute expiry
- FR-AUTH-006: Automatic token refresh before expiry
- FR-AUTH-007: Support for "Remember Me" functionality

**Non-Functional Requirements**:
- NFR-AUTH-001: Authentication must complete in <2 seconds
- NFR-AUTH-002: Passwords must be hashed using bcrypt
- NFR-AUTH-003: Support minimum 1,000 concurrent users

**User Stories**:
- As a parent, I want to create an account so I can manage my family
- As a parent, I want to add my children to the account without requiring their emails
- As a user, I want to stay logged in on my device for convenience
- As a child, I want to log in with my parent-created credentials

#### 1.2 Task Management
**Priority**: P0 (Critical)

**Functional Requirements**:
- FR-TASK-001: Parents can create tasks with title, description, points, and assignee
- FR-TASK-002: Users can view tasks assigned to them
- FR-TASK-003: Users can mark tasks as complete
- FR-TASK-004: Parents can approve or reject completed tasks
- FR-TASK-005: Tasks have states: pending, in-progress, awaiting-approval, approved, rejected
- FR-TASK-006: Tasks can be one-time or recurring (daily, weekly, monthly)
- FR-TASK-007: Tasks can have due dates
- FR-TASK-008: Parents can edit tasks
- FR-TASK-009: Parents can delete tasks
- FR-TASK-010: Tasks include photo upload capability for proof of completion

**Non-Functional Requirements**:
- NFR-TASK-001: Task creation must complete in <200ms locally
- NFR-TASK-002: Support minimum 1,000 tasks per family
- NFR-TASK-003: Task list must render in <500ms

**User Stories**:
- As a parent, I want to create a task with specific details so my child knows what to do
- As a child, I want to see all my assigned tasks in one place
- As a child, I want to mark tasks complete and submit photos as proof
- As a parent, I want to review and approve completed tasks before awarding points
- As a parent, I want to reject tasks with a reason if they're not done properly

#### 1.3 Points & Rewards System
**Priority**: P0 (Critical)

**Functional Requirements**:
- FR-POINTS-001: Users earn points upon task approval
- FR-POINTS-002: Users can view their current point balance
- FR-POINTS-003: Points history shows earned and spent points
- FR-POINTS-004: Parents can create rewards with point costs
- FR-POINTS-005: Users can redeem points for rewards
- FR-POINTS-006: Parents can approve or deny reward redemptions
- FR-POINTS-007: Point transactions are immutable (audit trail)
- FR-POINTS-008: Parents can manually adjust points with reason

**Non-Functional Requirements**:
- NFR-POINTS-001: Point balance must always be accurate
- NFR-POINTS-002: Point transactions must be atomic
- NFR-POINTS-003: Support point history up to 1 year

**User Stories**:
- As a child, I want to see how many points I have earned
- As a child, I want to redeem my points for rewards
- As a parent, I want to create custom rewards that motivate my children
- As a parent, I want to see a history of all point transactions

#### 1.4 Offline Functionality
**Priority**: P0 (Critical)

**Functional Requirements**:
- FR-OFFLINE-001: All read operations work offline
- FR-OFFLINE-002: Task creation/editing/completion works offline
- FR-OFFLINE-003: Point balance displays last known value offline
- FR-OFFLINE-004: Changes are queued for sync when offline
- FR-OFFLINE-005: UI indicates offline/online status
- FR-OFFLINE-006: User is notified when going offline/online
- FR-OFFLINE-007: Pending sync count is visible

**Non-Functional Requirements**:
- NFR-OFFLINE-001: Apps must work 100% offline for 30+ days
- NFR-OFFLINE-002: Sync queue can hold 1,000+ changes
- NFR-OFFLINE-003: No data loss during offline period

**User Stories**:
- As a user, I want the app to work when I don't have internet
- As a user, I want to know when I'm offline and changes aren't syncing
- As a user, I want my changes automatically synced when I come back online

#### 1.5 Data Synchronization
**Priority**: P0 (Critical)

**Functional Requirements**:
- FR-SYNC-001: Auto-sync every 30 seconds when online
- FR-SYNC-002: Manual sync button available
- FR-SYNC-003: Sync on app launch if online
- FR-SYNC-004: Sync on network reconnection
- FR-SYNC-005: Last sync timestamp displayed
- FR-SYNC-006: Sync errors are logged and displayed
- FR-SYNC-007: Sync retries 3 times with exponential backoff
- FR-SYNC-008: Conflict resolution using Last-Write-Wins strategy

**Non-Functional Requirements**:
- NFR-SYNC-001: Sync must complete in <500ms for typical payload (<100 changes)
- NFR-SYNC-002: Sync success rate must be >99%
- NFR-SYNC-003: Conflicts occur in <0.1% of syncs
- NFR-SYNC-004: Support syncing 1000+ changes in one session

**User Stories**:
- As a user, I want my data automatically synced without thinking about it
- As a user, I want to see when the last sync occurred
- As a user, I want to manually trigger a sync if needed
- As a parent, I want to be confident that all family members see the same data

---

### 2. Secondary Features (Post-MVP)

#### 2.1 Family Dashboard
**Priority**: P1 (High)

**Functional Requirements**:
- FR-DASH-001: Parents see overview of all family members' tasks
- FR-DASH-002: Weekly/monthly progress charts
- FR-DASH-003: Leaderboard showing point rankings
- FR-DASH-004: Completion rate statistics
- FR-DASH-005: Most active family member highlight

**User Stories**:
- As a parent, I want to see an overview of all family activity
- As a parent, I want to track trends in task completion over time

#### 2.2 Notifications
**Priority**: P1 (High)

**Functional Requirements**:
- FR-NOTIF-001: Parents receive notifications when tasks are completed
- FR-NOTIF-002: Children receive notifications when tasks are approved/rejected
- FR-NOTIF-003: Reminder notifications for tasks due soon
- FR-NOTIF-004: Notification preferences per user

**User Stories**:
- As a parent, I want to be notified when tasks need review
- As a child, I want to be reminded about tasks I need to complete

#### 2.3 Task Templates
**Priority**: P2 (Medium)

**Functional Requirements**:
- FR-TEMPLATE-001: Parents can save tasks as templates
- FR-TEMPLATE-002: Templates can be applied to multiple family members
- FR-TEMPLATE-003: Pre-built templates for common chores

**User Stories**:
- As a parent, I want to quickly assign common chores without recreating them

#### 2.4 Streak & Bonus System
**Priority**: P2 (Medium)

**Functional Requirements**:
- FR-STREAK-001: Track consecutive days of task completion
- FR-STREAK-002: Bonus points for maintaining streaks
- FR-STREAK-003: Visual streak indicators

**User Stories**:
- As a child, I want to be rewarded for consistency
- As a child, I want to see my streak progress

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  SPA (Browser)              │  WPF (Desktop)                │
│  - HTML/CSS/JavaScript      │  - C# / .NET 6                │
│  - IndexedDB Storage        │  - SQLite Database            │
│  - Netlify Hosted           │  - Local Install              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ (HTTPS + JWT)
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                 │
├─────────────────────────────────────────────────────────────┤
│  ASP.NET Core Web API (Railway.app)                         │
│  - Sync Controller                                           │
│  - Authentication Middleware                                 │
│  - Conflict Resolution Service                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ (PostgreSQL Connection)
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL                                         │
│  - Users, Tasks, Points, Rewards                            │
│  - Row Level Security                                        │
│  - File Storage                                              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **SPA Frontend** | Vanilla JavaScript → React (future) | Existing codebase, easy upgrade path |
| **SPA Storage** | IndexedDB | 50MB+ capacity, indexed queries, async |
| **SPA Hosting** | Netlify | FREE 100GB bandwidth, CI/CD |
| **WPF Desktop** | C# / .NET 6 / WPF | Developer expertise, native Windows |
| **WPF Storage** | SQLite + EF Core | Lightweight, SQL support, no server |
| **Backend API** | ASP.NET Core 6 Web API | C# expertise, performance, modern |
| **API Hosting** | Railway.app | FREE $5/month credit, .NET support |
| **Database** | Supabase PostgreSQL | FREE 500MB, auth included, RLS |
| **Authentication** | Supabase Auth + JWT | FREE, OAuth support, tokens |
| **File Storage** | Supabase Storage | FREE 1GB, integrated |
| **Monitoring** | Sentry (errors) | FREE 5,000 errors/month |
| **Uptime** | Uptime Robot | FREE 50 monitors |

### Data Flow

1. **User Action** → Saved to local storage (IndexedDB/SQLite) instantly
2. **Queue Sync** → Change added to sync queue with timestamp & change ID
3. **Background Sync** → POST to /api/sync with JWT token (every 30s when online)
4. **Server Processing** → Validate token, process changes, resolve conflicts
5. **Client Update** → Receive server response, update local storage

### Conflict Resolution

**Strategy**: Last-Write-Wins (LWW)

**Algorithm**:
```
if (clientTimestamp > serverTimestamp) {
    server.update(clientData);
    return { accepted: true };
} else {
    return { accepted: false, serverData: server.data };
}
```

**Rationale**: Simple, fast, works for 95% of cases. Manual resolution can be added later for critical conflicts.

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new account
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout (invalidate token)

### Tasks
- `GET /api/tasks` - Get all tasks for user
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/{id}/complete` - Mark task complete
- `POST /api/tasks/{id}/approve` - Approve completed task
- `POST /api/tasks/{id}/reject` - Reject completed task

### Points
- `GET /api/points` - Get current point balance
- `GET /api/points/history` - Get point transaction history
- `POST /api/points/adjust` - Manually adjust points (admin only)

### Rewards
- `GET /api/rewards` - Get all rewards
- `POST /api/rewards` - Create reward
- `PUT /api/rewards/{id}` - Update reward
- `DELETE /api/rewards/{id}` - Delete reward
- `POST /api/rewards/{id}/redeem` - Redeem reward

### Sync
- `POST /api/sync` - Sync changes
- `GET /api/sync/status` - Get sync status

### Family
- `GET /api/family/members` - Get all family members
- `POST /api/family/members` - Add family member
- `DELETE /api/family/members/{id}` - Remove family member

---

## Security Requirements

### Authentication & Authorization
- **SEC-001**: All API endpoints (except /register and /login) require JWT token
- **SEC-002**: JWT tokens expire after 60 minutes (configurable)
- **SEC-003**: Token refresh available before expiry
- **SEC-004**: Passwords hashed with bcrypt (cost factor 12)
- **SEC-005**: Rate limiting: 100 requests/minute per IP

### Data Security
- **SEC-006**: All API calls over HTTPS only
- **SEC-007**: Row Level Security (RLS) enabled on all database tables
- **SEC-008**: Users can only access their own family data
- **SEC-009**: SQL injection prevented via Entity Framework
- **SEC-010**: Input validation on all API endpoints

### Privacy
- **SEC-011**: GDPR compliant data handling
- **SEC-012**: Data export capability for users
- **SEC-013**: Account deletion removes all user data
- **SEC-014**: No sensitive data in browser localStorage (use IndexedDB)
- **SEC-015**: Child accounts require parental consent

---

## Performance Requirements

### Response Times
- **PERF-001**: Local operations (IndexedDB/SQLite): <100ms
- **PERF-002**: API sync endpoint: <500ms for typical payload
- **PERF-003**: Page load time: <2 seconds
- **PERF-004**: Task list rendering: <500ms for 100 tasks

### Scalability
- **PERF-005**: Support 1,000 concurrent users
- **PERF-006**: Support 10,000 tasks per family
- **PERF-007**: Support 10,000 point transactions per user
- **PERF-008**: Database queries: <50ms average

### Reliability
- **PERF-009**: API uptime: 99.5%
- **PERF-010**: Sync success rate: >99%
- **PERF-011**: Zero data loss during offline periods
- **PERF-012**: Auto-recovery from sync failures

### Storage
- **PERF-013**: IndexedDB: Support 50MB per user
- **PERF-014**: SQLite: Support 100MB database per family
- **PERF-015**: Supabase: 500MB free tier adequate for 1,000 users

---

## Implementation Timeline

### Week 1: Foundation
**Deliverables**:
- Supabase project created
- Database schema deployed
- ASP.NET Core API project created
- Authentication endpoints implemented
- Deployed to Railway.app

**Success Criteria**:
- Can register and login via API
- JWT tokens issued correctly
- Database connection working

---

### Week 2: SPA Local-First
**Deliverables**:
- IndexedDB wrapper implemented
- Sync queue system working
- Supabase Auth integrated
- Login/logout UI
- Task list UI (read-only)

**Success Criteria**:
- Can store data locally
- Can sync with server
- Works completely offline

---

### Week 3: WPF Application
**Deliverables**:
- WPF project created
- SQLite database setup
- Entity Framework models
- Sync service implementation
- Basic task UI

**Success Criteria**:
- Desktop app runs
- Can sync with API
- Local SQLite storage works

---

### Week 4: Backend Sync Logic
**Deliverables**:
- SyncController complete
- Conflict resolution implemented
- Task approval workflow
- Points calculation

**Success Criteria**:
- End-to-end sync working
- Conflicts handled gracefully
- Multi-device tested

---

### Week 5: Testing & Polish
**Deliverables**:
- Automated tests (xUnit, Playwright)
- Performance optimization
- Bug fixes
- Security audit
- Documentation

**Success Criteria**:
- All test scenarios pass
- Performance benchmarks met
- No critical bugs

---

### Week 6: Deployment & Launch
**Deliverables**:
- SPA deployed to Netlify
- WPF published to GitHub Releases
- Monitoring configured
- User documentation
- Beta launch

**Success Criteria**:
- Apps accessible to users
- Monitoring active
- First 10 beta users onboarded

---

## Risk Assessment & Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Sync conflicts causing data loss | Medium | Critical | Implement robust conflict resolution with audit logs |
| IndexedDB storage limits exceeded | Low | High | Implement auto-cleanup of old data, warn users |
| API hosting costs exceed budget | Medium | Medium | Monitor usage closely, optimize queries, migrate if needed |
| Supabase free tier limitations | Low | Medium | Monitor database size, plan upgrade path |
| JWT token security breach | Low | Critical | Short expiry, secure storage, rate limiting |
| Offline mode breaks unexpectedly | Medium | Critical | Comprehensive testing, fallback mechanisms |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low user adoption | Medium | High | Beta testing, user feedback, marketing |
| Competing products | High | Medium | Unique offline-first approach, family focus |
| Platform dependency (Netlify, Railway) | Low | Medium | Design for portability, have migration plan |
| Regulatory compliance (COPPA) | Medium | High | Require parental consent, age verification |

### Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Sync implementation takes longer | High | Medium | Allocate extra time in Week 4, have backup plan |
| WPF development delays | Medium | Low | Can launch SPA-only initially |
| Testing reveals major bugs | Medium | High | Daily testing throughout, not just Week 5 |

---

## Success Metrics & KPIs

### User Metrics
- **Monthly Active Users (MAU)**: Track growth month-over-month
- **Daily Active Users (DAU)**: Measure engagement
- **DAU/MAU Ratio**: Target >30% (indicates sticky product)
- **User Retention**: 70%+ after 30 days, 50%+ after 90 days
- **Churn Rate**: <5% monthly

### Product Metrics
- **Tasks Completed per User**: Target 20+ per month
- **Points Earned per User**: Track engagement
- **Reward Redemptions**: Measure gamification effectiveness
- **Sync Success Rate**: >99%
- **Offline Usage**: % of users who use offline features

### Technical Metrics
- **API Response Time**: p50 <200ms, p95 <500ms, p99 <1s
- **Sync Time**: p50 <300ms, p95 <1s
- **Error Rate**: <0.5%
- **Uptime**: >99.5%
- **Database Query Time**: Average <50ms

### Business Metrics
- **Cost per User**: <$0.05/month at 10k users
- **Revenue per User**: Target $3-5/month
- **Gross Margin**: >90%
- **Customer Acquisition Cost (CAC)**: <$10
- **Lifetime Value (LTV)**: >$100
- **LTV/CAC Ratio**: >10:1

---

## Assumptions & Dependencies

### Assumptions
1. Users have reliable internet at least once per day for syncing
2. Families have 2-6 members on average
3. Users create 10-30 tasks per family per month
4. 70%+ of tasks are completed
5. Users are comfortable with desktop/web applications
6. Windows 10+ is primary desktop OS
7. Modern browsers (Chrome, Firefox, Safari, Edge) are used

### Dependencies
- **Supabase**: PostgreSQL database and authentication
- **Railway.app**: API hosting
- **Netlify**: SPA hosting
- **GitHub**: Source control and releases
- **NuGet**: .NET package management
- **npm**: JavaScript package management

### Constraints
- Budget: $0/month until 1,000 users
- Timeline: 6 weeks to MVP
- Team: Solo developer
- Technology: C# for backend/desktop, JavaScript for web

---

## Open Questions

1. **Subscription Pricing**: What is optimal pricing? $2.99/month? $4.99/month? Annual discount?
2. **Family Size Limits**: Should free tier have family member limits? (e.g., 5 members max)
3. **Task Limits**: Should there be limits on active tasks? (e.g., 50 active tasks)
4. **Photo Storage**: How much photo storage per family? Compress photos?
5. **Export Format**: What format for data export? JSON? CSV? Both?
6. **Recurring Tasks**: How complex should recurrence be? Simple daily/weekly or full cron support?
7. **Notifications**: Push notifications or email only for MVP?
8. **Internationalization**: English-only for MVP or multi-language?
9. **Mobile Apps**: Native iOS/Android or focus on web-responsive?
10. **Accessibility**: WCAG 2.1 AA compliance required?

---

## Approval & Sign-off

**Document Version**: 1.0  
**Last Updated**: February 10, 2026  
**Next Review**: Start of Week 2 (February 17, 2026)

**Prepared By**: Claude AI Assistant  
**Approved By**: [Zanzikahn - Pending]

---

## Appendices

### Appendix A: Glossary
- **Local-First**: Architecture where data lives on user device, syncs to cloud
- **IndexedDB**: Browser-based key-value database with 50MB+ storage
- **SQLite**: Serverless SQL database stored as a file
- **JWT**: JSON Web Token for stateless authentication
- **RLS**: Row Level Security in PostgreSQL
- **SPA**: Single Page Application (web app)
- **WPF**: Windows Presentation Foundation (desktop app)
- **EF Core**: Entity Framework Core (ORM)
- **LWW**: Last-Write-Wins conflict resolution

### Appendix B: References
- Presentation: LocalFirst_SaaS_Platform_Guide.pptx
- Summary: LocalFirst_SaaS_Summary.md
- Supabase Docs: https://supabase.com/docs
- Railway Docs: https://docs.railway.app
- IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Local-First Software: https://www.inkandswitch.com/local-first/

### Appendix C: Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Feb 10, 2026 | Initial PRD created | Claude AI |

---

**END OF DOCUMENT**
