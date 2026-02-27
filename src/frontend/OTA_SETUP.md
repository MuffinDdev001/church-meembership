# OTA Updates - Quick Setup

## What Was Implemented

Your Church Membership Electron app now supports automatic over-the-air (OTA) updates using **electron-updater** and GitHub releases.

### Features Added

✅ **Automatic update checks** on app startup (after 3 seconds)  
✅ **User-friendly dialogs** for update notifications  
✅ **Download progress tracking** shown in window title  
✅ **Manual update check** via File → Check for Updates menu  
✅ **Non-intrusive updates** - users can postpone updates  
✅ **Auto-install on quit** - updates install when app closes  

## Before Your First Release

Update these placeholders in `package.json`:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/YOUR_REPO.git"
},
...
"publish": [{
  "provider": "github",
  "owner": "YOUR_USERNAME",
  "repo": "YOUR_REPO"
}]
```

## How to Publish an Update

### 1. Update Version
Edit `package.json` line 3:
```json
"version": "1.0.2"
```

### 2. Build the App
```bash
cd /Users/user/Documents/church_membership/church-meembership/src/frontend
npm run electron:build:win
```

### 3. Create GitHub Release
- Go to your GitHub repository
- Create a new release with tag `v1.0.2`
- Upload from `dist/` folder:
  - **Windows**: `ChurchMembership-Setup-1.0.2.exe` + `latest.yml`
  - **Mac**: `ChurchMembership-1.0.2-mac.zip` + `ChurchMembership-1.0.2.dmg` + `latest-mac.yml`
- Publish the release

> **Important for Mac**: You need both the `.zip` (for auto-updates) AND `.dmg` (for manual downloads). The auto-updater uses the zip file!

### 4. Test
- Install the old version
- Launch it
- Wait for update notification ✨

## For Users

When you launch the app:
1. It automatically checks for updates
2. If an update is available, you'll see a dialog
3. Choose to download now or later
4. When download completes, choose to restart now or later
5. Update installs automatically

Manual check: **File → Check for Updates**

## Documentation

See [OTA Updates Guide](file:///Users/user/.gemini/antigravity/brain/736c4a17-0c9a-4d5c-9ee6-108867b293e0/ota_updates_guide.md) for complete documentation including:
- Detailed publishing instructions
- Automated publishing with GitHub tokens
- Troubleshooting
- Security considerations (code signing)
- Advanced features (update channels)

## Files Modified

- [`package.json`](file:///Users/user/Documents/church_membership/church-meembership/src/frontend/package.json) - Added electron-updater, repository info, and publish config
- [`main.js`](file:///Users/user/Documents/church_membership/church-meembership/src/frontend/main.js) - Complete auto-updater implementation with dialogs and menu

## Next Steps

1. Update YOUR_USERNAME and YOUR_REPO in package.json
2. Build and test locally
3. Create your first GitHub release
4. (Optional) Set up code signing to avoid Windows SmartScreen warnings
