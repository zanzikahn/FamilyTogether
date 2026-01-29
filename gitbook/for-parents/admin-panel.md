---
description: Your control center for managing FamilyTogether
---

# Admin Panel Overview

The Admin Panel is where parents manage everything in FamilyTogether.

## Accessing the Admin Panel

When you log in with a parent account, you go directly to the Admin Panel.

If you're in the User View, click the **⚙️ Admin** button in the top-right corner.

---

## Admin Panel Sections

The Admin Panel has several sections:

{% tabs %}
{% tab title="📊 Data Management" %}
### Backup & Restore

Located at the top of the Admin Panel.

**Features:**
- 💾 Save Now — Manual save
- 📤 Export Backup — Download backup file
- 📥 Import Backup — Restore from file
- 🗑️ Clear All — Reset everything
- Auto-save toggle

[Learn more about backups →](../data-backup/creating-backups.md)
{% endtab %}

{% tab title="⏳ Pending Approvals" %}
### Tasks Waiting for Review

Shows all tasks submitted by kids that need your approval.

**For each pending task:**
- Task name
- Who submitted it
- Points they'll earn
- When they submitted
- ✅ Approve / ❌ Reject buttons

[Learn more about approving →](approving-tasks.md)
{% endtab %}

{% tab title="🔄 Quick Actions" %}
### Reset Functions

Fast buttons for common actions:

| Button | What It Does |
|--------|--------------|
| 🔄 Reset Daily | Clear all daily task completions |
| 🔄 Reset Weekly | Clear all weekly task completions |
| 🔄 Reset Monthly | Clear all monthly task completions |
| 🔄 Reset Points | Set everyone's points to zero |
{% endtab %}

{% tab title="⚙️ Settings" %}
### Configuration Options

**Point Multiplier:**
- 1.0 = Normal points
- 1.5 = 50% bonus
- 2.0 = Double points!

**Login Security:**
- Max failed attempts before lockout
- Currently set to 3 attempts

[Learn more about settings →](settings.md)
{% endtab %}
{% endtabs %}

---

## Management Sections

Below the quick actions, you'll find management areas:

<table data-card-size="large" data-view="cards">
<thead>
<tr>
<th></th>
<th></th>
<th data-hidden data-card-target data-type="content-ref"></th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>📋 Task Management</strong></td>
<td>Add, edit, and delete daily/weekly/monthly tasks</td>
<td><a href="managing-tasks.md">managing-tasks.md</a></td>
</tr>
<tr>
<td><strong>👨‍👩‍👧‍👦 Family Members</strong></td>
<td>Add members, change names, reset passwords</td>
<td><a href="managing-members.md">managing-members.md</a></td>
</tr>
<tr>
<td><strong>🎁 Rewards</strong></td>
<td>Create and customize reward options</td>
<td><a href="managing-rewards.md">managing-rewards.md</a></td>
</tr>
</tbody>
</table>

---

## Switching to User View

Want to see the app like your kids do? Or complete tasks yourself?

Click the **👤 User View** button in the top-right corner.

{% hint style="info" %}
**Why use User View?**

- Complete your own tasks
- See what the dashboard looks like for kids
- Test that rewards display correctly
- Redeem rewards for yourself
{% endhint %}

---

## Admin Panel Layout

```
┌──────────────────────────────────────────────────────┐
│  ⚙️ Admin Control Panel          [👤 User] [Logout] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  💾 Data Management                                  │
│  ┌────────────────────────────────────────────────┐  │
│  │ [Export] [Import] [Save Now] [Clear All]       │  │
│  │ ☑️ Auto-save changes                           │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ⏳ Pending Task Approvals                           │
│  ┌────────────────────────────────────────────────┐  │
│  │ Task Name | Submitted by | [✅] [❌]            │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  🔄 Quick Actions                                    │
│  [Reset Daily] [Reset Weekly] [Reset Monthly] [...]  │
│                                                      │
│  ⚙️ Settings                                         │
│  Point Multiplier: [1.0]  Max Login Attempts: [3]    │
│                                                      │
│  📋 Task Management                                  │
│  ├── Daily Tasks (8)     [➕ Add Task]               │
│  ├── Weekly Tasks (7)    [➕ Add Task]               │
│  └── Monthly Tasks (5)   [➕ Add Task]               │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │ 👨‍👩‍👧‍👦 Family       │  │ 🎁 Rewards       │           │
│  │ Members (4)     │  │ (6)             │           │
│  │ [➕ Add Member] │  │ [➕ Add Reward] │           │
│  └─────────────────┘  └─────────────────┘           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Common Admin Tasks

### Daily Admin Routine

1. **Check pending approvals** — Review and approve/reject submitted tasks
2. **Reset daily tasks** — Click "Reset Daily" at the start of each day

### Weekly Admin Routine

1. **Reset weekly tasks** — Click "Reset Weekly" on your chosen start day
2. **Review point balances** — Check if kids are earning appropriately

### Monthly Admin Routine

1. **Reset monthly tasks** — Click "Reset Monthly" at month start
2. **Create backup** — Export a backup file for safety
3. **Review rewards** — Update rewards if needed

---

## Next Steps

{% content-ref url="approving-tasks.md" %}
[approving-tasks.md](approving-tasks.md)
{% endcontent-ref %}
