---
description: Import data from a backup file or reset to defaults
---

# Restoring Data

Learn how to restore your data from a backup or start fresh.

## Restoring from a Backup

If you've lost data or are moving to a new device, you can restore from a backup file.

{% stepper %}
{% step %}
### Find Your Backup File

Locate the `.json` backup file you previously exported.
{% endstep %}

{% step %}
### Open Admin Panel

Log into FamilyTogether as a parent.
{% endstep %}

{% step %}
### Click Import Backup

In the Data Management section, click **"📥 Import Backup"**.
{% endstep %}

{% step %}
### Select the File

A file picker opens. Navigate to and select your backup `.json` file.
{% endstep %}

{% step %}
### Confirm Import

A message shows:
- Family name from the backup
- When it was exported
- Warning that current data will be replaced

Click **OK** to confirm.
{% endstep %}

{% step %}
### Log In Again

After import, you'll return to the login screen. Log in to see your restored data!
{% endstep %}
{% endstepper %}

---

## What Gets Restored?

| Data | Restored |
|------|----------|
| Family members | ✅ All profiles and points |
| Passwords | ✅ Original passwords |
| Tasks | ✅ All tasks and completions |
| Rewards | ✅ All rewards |
| Settings | ✅ Point multiplier, etc. |

---

## Important Warnings

{% hint style="danger" %}
**Import REPLACES Everything!**

Importing a backup completely overwrites your current data. There's no merge — it's a full replacement.
{% endhint %}

### Before Importing:

1. **Export current data first** (if you want to keep it)
2. **Verify the backup file** is the one you want
3. **Confirm the date** matches what you expect

---

## Starting Fresh (Clear All Data)

Want to reset everything to defaults?

{% stepper %}
{% step %}
### Consider Exporting First

Create a backup of current data in case you change your mind.
{% endstep %}

{% step %}
### Click Clear All

In Data Management, click **"🗑️ Clear All"**.
{% endstep %}

{% step %}
### Enter Parent Password

You'll need to enter a parent password to confirm this action.
{% endstep %}

{% step %}
### Confirm Reset

You'll be asked to confirm because this is permanent.
{% endstep %}

{% step %}
### Start Fresh

Everything resets to default:
- Default family members (Parent 1, Parent 2, Teen, Child)
- Default passwords
- Default tasks
- Default rewards
- All points reset to 0
- All completions cleared
{% endstep %}
{% endstepper %}

{% hint style="warning" %}
**Clear All cannot be undone!**

Unless you have a backup file, your data is gone forever.
{% endhint %}

---

## Troubleshooting Restore Issues

<details>
<summary><strong>"Invalid backup file format"</strong></summary>

**Cause:** File is corrupted or not a valid FamilyTogether backup.

**Solutions:**
- Try a different backup file
- Open the file in a text editor - does it look like JSON?
- File may have been modified incorrectly

</details>

<details>
<summary><strong>"Version mismatch"</strong></summary>

**Cause:** Backup was created with a different version.

**Solutions:**
- Usually still works - try anyway
- May need to manually re-create some data

</details>

<details>
<summary><strong>Import Seems to Work But Data is Wrong</strong></summary>

**Possible issues:**
- Imported an old backup (check the date)
- Imported wrong family's backup
- Backup was incomplete when created

**Solution:** Try a different, more recent backup file.

</details>

<details>
<summary><strong>Can't Find Backup File</strong></summary>

**Common locations:**
- Downloads folder
- Cloud storage (Google Drive, Dropbox)
- Email attachments
- USB drives

</details>

---

## Moving to a New Device

To transfer FamilyTogether to a new computer:

{% stepper %}
{% step %}
### Export on Old Device

Create a fresh backup from the Admin Panel.
{% endstep %}

{% step %}
### Transfer the File

Move the `.json` file to new device via:
- USB drive
- Email
- Cloud storage
{% endstep %}

{% step %}
### Copy FamilyTogether Files

Copy the `index.html` file (and any related files) to the new device.
{% endstep %}

{% step %}
### Import on New Device

Open FamilyTogether on the new device and import the backup.
{% endstep %}
{% endstepper %}

---

## Using Multiple Devices

{% hint style="info" %}
**FamilyTogether doesn't sync automatically between devices.**

Each device has its own local storage.
{% endhint %}

### Workaround for Multi-Device Use:

1. **Designate one "main" device** for regular use
2. **Export backup frequently** from the main device
3. **Import to other devices** when needed
4. **Be careful about conflicting changes** — the last import wins

---

## Recovery Options Summary

| Situation | Solution |
|-----------|----------|
| Lost data, have backup | Import backup file |
| Lost data, no backup | Start fresh with Clear All |
| Moving to new device | Export → Transfer → Import |
| Want to undo recent changes | Import an older backup |
| Complete fresh start | Clear All |

---

## Related Topics

{% content-ref url="creating-backups.md" %}
[creating-backups.md](creating-backups.md)
{% endcontent-ref %}

{% content-ref url="auto-save.md" %}
[auto-save.md](auto-save.md)
{% endcontent-ref %}
