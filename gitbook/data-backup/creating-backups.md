---
description: Export your data to a backup file
---

# Creating Backups

Protect your family's progress by exporting backup files regularly.

## Why Backup?

{% hint style="warning" %}
**Browser storage isn't permanent!**

Your data can be lost if:
- Browser data is cleared
- Browser is reinstalled
- Computer problems occur
- Someone clears the cache
{% endhint %}

Backup files let you restore everything if something goes wrong.

---

## How to Create a Backup

{% stepper %}
{% step %}
### Open Admin Panel

Log in as a parent and go to the Admin Panel.
{% endstep %}

{% step %}
### Find Data Management

Look for the **"💾 Data Management"** section at the top.
{% endstep %}

{% step %}
### Click Export Backup

Click the **"📤 Export Backup"** button.
{% endstep %}

{% step %}
### Name Your Backup (Optional)

A prompt asks for your family name. Enter something recognizable or click OK for default.
{% endstep %}

{% step %}
### Save the File

A `.json` file downloads to your computer.

Default name: `family-cleaning-backup-2026-01-28.json`
{% endstep %}
{% endstepper %}

---

## What's In a Backup File?

The backup includes everything:

| Data | Included |
|------|----------|
| Family members | ✅ All profiles, points, passwords |
| Tasks | ✅ All daily/weekly/monthly tasks |
| Task completions | ✅ Who completed what |
| Rewards | ✅ All reward definitions |
| Settings | ✅ Point multiplier, login settings |
| Metadata | ✅ Export date, version info |

---

## Backup File Details

### File Format

Backups are **JSON files** (plain text, human-readable).

### File Size

Typically very small: 2-10 KB

### File Name Pattern

```
family-cleaning-backup-YYYY-MM-DD.json
```

Example: `family-cleaning-backup-2026-01-28.json`

---

## Where to Store Backups

{% tabs %}
{% tab title="Recommended" %}
### Best Storage Locations

- ☁️ **Cloud storage** (Google Drive, OneDrive, Dropbox)
- 📧 **Email to yourself**
- 💾 **USB drive**
- 💻 **Different computer**

These survive even if your main computer has problems.
{% endtab %}

{% tab title="Not Recommended" %}
### Risky Storage Locations

- ❌ Same computer's Downloads folder only
- ❌ Same browser's storage
- ❌ Temporary folders

These can be lost along with your original data.
{% endtab %}
{% endtabs %}

---

## Backup Schedule

{% hint style="success" %}
**Create backups regularly!**
{% endhint %}

| Frequency | When | Why |
|-----------|------|-----|
| **Weekly** | Every Sunday | Protects recent progress |
| **Monthly** | 1st of month | Long-term archive |
| **Before changes** | Before clearing data | Safety net |
| **After big events** | Major reward redemptions | Capture milestones |

---

## Backup Organization Tips

### Naming Convention

Include dates in filenames:
```
FamilyTogether-Backup-2026-01-28.json
FamilyTogether-Backup-2026-02-01.json
FamilyTogether-Backup-2026-02-08.json
```

### Folder Structure

```
FamilyTogether Backups/
├── 2026-01/
│   ├── backup-2026-01-07.json
│   ├── backup-2026-01-14.json
│   ├── backup-2026-01-21.json
│   └── backup-2026-01-28.json
└── 2026-02/
    └── backup-2026-02-01.json
```

### Keep Multiple Copies

Don't just keep one backup! Keep at least:
- 📁 Last 4 weekly backups
- 📁 Last 3 monthly backups

---

## Verifying Your Backup

After creating a backup, verify it works:

1. Open the `.json` file in a text editor
2. Check you see data (names, tasks, etc.)
3. File should NOT be empty or show errors

### What Good Backup Data Looks Like:

```json
{
  "version": "1.0",
  "exportedAt": "2026-01-28T15:30:00.000Z",
  "familyName": "Smith Family",
  "familyMembers": [
    {"id": 1, "name": "Dad", "points": 45, ...},
    ...
  ],
  "tasks": {...},
  "rewards": [...]
}
```

---

## Common Questions

<details>
<summary><strong>Can I open backup files?</strong></summary>

Yes! They're plain text JSON files. Open with:
- Notepad (Windows)
- TextEdit (Mac)
- Any code editor
- Online JSON viewers

</details>

<details>
<summary><strong>Can I edit backup files?</strong></summary>

Technically yes, but not recommended unless you know JSON format. Mistakes can corrupt the file.

</details>

<details>
<summary><strong>How many backups should I keep?</strong></summary>

At minimum: 4 weekly + 3 monthly. Storage is cheap; data recovery is hard!

</details>

<details>
<summary><strong>Can I backup to the cloud automatically?</strong></summary>

Not directly, but you can:
1. Save backups to a cloud-synced folder (like Google Drive folder)
2. They'll upload automatically

</details>

---

## Next Steps

Learn how to restore from a backup:

{% content-ref url="restoring-data.md" %}
[restoring-data.md](restoring-data.md)
{% endcontent-ref %}
