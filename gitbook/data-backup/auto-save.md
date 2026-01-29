---
description: How FamilyTogether automatically saves your data
---

# How Auto-Save Works

FamilyTogether automatically saves your family's progress so you don't lose anything!

## What Gets Saved

Auto-save preserves:

| Data Type | Included |
|-----------|----------|
| Family members | ✅ Names, avatars, points, passwords |
| Tasks | ✅ All tasks and their completions |
| Rewards | ✅ All reward definitions |
| Settings | ✅ Point multiplier, login settings |
| Completion history | ✅ Who did what and when |

---

## When Does It Save?

{% tabs %}
{% tab title="Automatic Triggers" %}
### Saves Automatically When:

- ⏰ Every 30 seconds (while app is open)
- 🚪 When you close the browser/tab
- ✅ After any important action (approvals, edits)
{% endtab %}

{% tab title="Manual Trigger" %}
### Save on Demand:

Click **"💾 Save Now"** in the Data Management section to force an immediate save.
{% endtab %}
{% endtabs %}

---

## Where Is Data Stored?

FamilyTogether saves to your **browser's local storage**.

```
Browser Local Storage
└── familyCleaningTracker
    ├── version: "1.0"
    ├── timestamp: "2026-01-28T..."
    ├── familyMembers: [...]
    ├── settings: {...}
    ├── tasks: {...}
    ├── rewards: [...]
    └── loginAttempts: {...}
```

{% hint style="info" %}
**Local storage means:**
- Data stays on YOUR device
- No internet required
- Private to your browser
- No cloud sync (use backups instead!)
{% endhint %}

---

## Storage Status Indicator

In the Admin Panel's Data Management section, you'll see:

```
🟢 Auto-save active (2.5 KB, saved Jan 28, 2026, 3:45 PM)
```

| Indicator | Meaning |
|-----------|---------|
| 🟢 Green dot | Data is being saved |
| Size (KB) | How much data is stored |
| Timestamp | When last saved |

---

## Auto-Save Toggle

You can turn auto-save on or off:

| Setting | Behavior |
|---------|----------|
| ☑️ **On** | Saves automatically (recommended) |
| ☐ **Off** | Only saves when you click "Save Now" |

{% hint style="warning" %}
**Keep Auto-Save ON!**

Turning it off risks losing data if you forget to save manually.
{% endhint %}

---

## Important Limitations

### Browser-Specific Storage

⚠️ Data is stored **per browser**. This means:

| Scenario | Result |
|----------|--------|
| Same browser, same computer | ✅ Data available |
| Different browser, same computer | ❌ Data NOT shared |
| Same browser, different computer | ❌ Data NOT shared |
| Private/Incognito mode | ❌ Data NOT saved |

### Data Can Be Lost If:

- Browser data/cache is cleared
- Browser is uninstalled
- Computer is wiped/reset
- Using private browsing mode

{% hint style="danger" %}
**This is why backups are important!**

Export backup files regularly to protect against data loss.
{% endhint %}

---

## Checking Save Status

### How to Verify Data is Saved:

1. Look at the storage status in Data Management
2. Check the timestamp - is it recent?
3. Close and reopen the app - is your data there?

### If Save Seems Broken:

1. Check if auto-save is enabled
2. Click "Save Now" manually
3. Check browser allows local storage
4. Make sure you're not in private mode
5. Try a different browser

---

## Best Practices

{% hint style="success" %}
**Keep Your Data Safe!**
{% endhint %}

1. **Keep auto-save ON** — Don't rely on manual saves
2. **Export backups regularly** — Weekly or monthly
3. **Use consistent browser** — Don't switch between browsers
4. **Avoid private mode** — Data won't persist
5. **Don't clear browser data** — Or export a backup first

---

## Related Topics

{% content-ref url="creating-backups.md" %}
[creating-backups.md](creating-backups.md)
{% endcontent-ref %}

{% content-ref url="restoring-data.md" %}
[restoring-data.md](restoring-data.md)
{% endcontent-ref %}
