---
description: The difference between Parent and Child accounts
---

# Understanding Accounts

FamilyTogether has two types of accounts: **Parent** and **Child**. Each has different abilities.

## Account Types

{% tabs %}
{% tab title="👶 Child Account" %}
### What Kids Can Do

| Feature | Available |
|---------|-----------|
| View assigned tasks | ✅ Yes |
| Submit completed tasks | ✅ Yes |
| View points balance | ✅ Yes |
| Redeem rewards | ✅ Yes |
| Resubmit rejected tasks | ✅ Yes |

### What Kids Cannot Do

| Feature | Available |
|---------|-----------|
| Approve/reject tasks | ❌ No |
| Add or edit tasks | ❌ No |
| Add or edit rewards | ❌ No |
| Manage family members | ❌ No |
| Change settings | ❌ No |
| Access admin panel | ❌ No |
{% endtab %}

{% tab title="👨‍👩‍👧 Parent Account" %}
### What Parents Can Do

**Everything kids can do, PLUS:**

| Feature | Available |
|---------|-----------|
| Access Admin Panel | ✅ Yes |
| Approve completed tasks | ✅ Yes |
| Reject tasks with feedback | ✅ Yes |
| Add/edit/delete tasks | ✅ Yes |
| Add/edit/delete rewards | ✅ Yes |
| Add/edit/delete family members | ✅ Yes |
| Change app settings | ✅ Yes |
| Reset task completions | ✅ Yes |
| Export/import data | ✅ Yes |
| Clear all data | ✅ Yes |
{% endtab %}
{% endtabs %}

---

## Profile Information

Each family member profile includes:

| Field | Description | Who Can Change |
|-------|-------------|----------------|
| **Name** | Display name shown everywhere | Parents only |
| **Avatar** | Emoji picture (👨‍🦲👩🧑‍🎓🧒 etc.) | Parents only |
| **Points** | Current point balance | Automatic (earned) or Parents |
| **Password** | Login password | Parents only |
| **Role** | Child or Parent | Parents only |

---

## How Points Work

{% hint style="info" %}
**Points are like money in a video game!**

Earn them by completing tasks, spend them on rewards.
{% endhint %}

### Earning Points (Kids)

1. Complete a real-world task (like making your bed)
2. Submit the task in the app
3. Wait for a parent to approve
4. Points are added to your balance!

### Earning Points (Parents)

Parents can complete tasks too! The difference:
- Parent task completions are **instantly approved**
- No waiting for someone else to check

---

## Task Approval Flow

```
Kid completes task → Submits in app → Task shows "Pending"
                                           ↓
                            Parent reviews the real work
                                           ↓
                         ┌─────────────────┴─────────────────┐
                         ↓                                   ↓
                    APPROVED                             REJECTED
                    Points added!                    Reason given
                                                     Kid can resubmit
```

---

## Security Features

{% hint style="warning" %}
**Account Protection**

FamilyTogether includes security features to protect accounts:
{% endhint %}

### Login Lockout

| Setting | Default Value |
|---------|---------------|
| Max wrong passwords | 3 attempts |
| Lockout duration | 5 minutes |

After 3 wrong password attempts, the account is locked for 5 minutes to prevent guessing.

### Parent-Only Actions

Sensitive actions require a parent account:
- Deleting family members
- Clearing all data
- Changing passwords

{% hint style="danger" %}
**Important for Parents**

Since this is a browser-based app, tech-savvy users could potentially access the browser console. For family use, parents should monitor browser access on shared devices.
{% endhint %}

---

## Switching Between Views (Parents Only)

Parents can switch between two views:

{% tabs %}
{% tab title="Admin Panel" %}
### ⚙️ Admin Panel

The control center for managing everything:
- Approve pending tasks
- Manage tasks, rewards, and members
- Configure settings
- Backup data

**Access:** Click **⚙️ Admin** button (shown when in User View)
{% endtab %}

{% tab title="User View" %}
### 👤 User View

See the app like a kid would:
- View your own tasks
- Check your points
- Redeem rewards
- Great for completing your own tasks!

**Access:** Click **👤 User View** button (shown when in Admin Panel)
{% endtab %}
{% endtabs %}

---

## Next Steps

{% content-ref url="../using-familytogether/user-dashboard.md" %}
[user-dashboard.md](../using-familytogether/user-dashboard.md)
{% endcontent-ref %}
