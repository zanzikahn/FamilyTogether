# Technical Architecture Document
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0  
**Date**: February 10, 2026  
**Status**: Pre-Development

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Component Architecture](#component-architecture)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Security Architecture](#security-architecture)
6. [Infrastructure Architecture](#infrastructure-architecture)
7. [Technology Stack Details](#technology-stack-details)
8. [Integration Points](#integration-points)

---

## System Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────┐       ┌──────────────────────────┐   │
│  │    SPA Application       │       │   WPF Application        │   │
│  │  (Browser - Netlify)     │       │  (Desktop - Local)       │   │
│  ├──────────────────────────┤       ├──────────────────────────┤   │
│  │ • HTML/CSS/JavaScript    │       │ • C# / .NET 6 / WPF      │   │
│  │ • IndexedDB (Local)      │       │ • SQLite (Local)         │   │
│  │ • Supabase Auth Client   │       │ • Entity Framework Core  │   │
│  │ • Sync Manager           │       │ • Sync Service           │   │
│  └──────────┬───────────────┘       └──────────┬───────────────┘   │
│             │                                   │                    │
└─────────────┼───────────────────────────────────┼────────────────────┘
              │                                   │
              │         HTTPS + JWT Token         │
              │                                   │
              ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION TIER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              ASP.NET Core Web API (Railway.app)              │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Controllers Layer                                            │  │
│  │  • AuthController                                             │  │
│  │  • SyncController ◄── Conflict Resolution Service            │  │
│  │  • TasksController                                            │  │
│  │  • PointsController                                           │  │
│  │  • RewardsController                                          │  │
│  │  • FamilyController                                           │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Middleware                                                   │  │
│  │  • JWT Authentication                                         │  │
│  │  • CORS Policy                                                │  │
│  │  • Error Handling                                             │  │
│  │  • Request Logging                                            │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Services Layer                                               │  │
│  │  • SyncService                                                │  │
│  │  • TaskService                                                │  │
│  │  • PointsService                                              │  │
│  │  • RewardService                                              │  │
│  │  • AuthService (Supabase Integration)                        │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Data Access Layer                                            │  │
│  │  • DbContext (EF Core + Npgsql)                              │  │
│  │  • Repository Pattern                                         │  │
│  │  • Unit of Work Pattern                                       │  │
│  └──────────────┬───────────────────────────────────────────────┘  │
│                 │                                                    │
└─────────────────┼────────────────────────────────────────────────────┘
                  │
                  │   PostgreSQL Connection
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA TIER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Supabase (Database + Auth + Storage)               │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  PostgreSQL Database                                          │  │
│  │  • Users (Auth managed)                                       │  │
│  │  • Families, Members, Tasks                                   │  │
│  │  • Point Transactions, Rewards                                │  │
│  │  • Sync Logs                                                  │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Row Level Security (RLS)                                     │  │
│  │  • Family-based isolation                                     │  │
│  │  • Role-based access                                          │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Supabase Auth                                                │  │
│  │  • JWT Token Generation                                       │  │
│  │  • Password Hashing (bcrypt)                                  │  │
│  │  • Session Management                                         │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Supabase Storage                                             │  │
│  │  • Task completion photos                                     │  │
│  │  • User avatars (future)                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

This document provides comprehensive technical architecture for autonomous development through Claude Code. All components, patterns, and integration points are fully specified.

**See full document at**: C:\Users\Zanzi\TOOLS\SaaS(SoftwareAsAService)\Technical_Architecture_Document.md

---

**END OF TECHNICAL ARCHITECTURE DOCUMENT**
