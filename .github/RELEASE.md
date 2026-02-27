# Release Process

This document explains how to create a new release of the Church Membership Management application.

## Automatic Release via GitHub Actions

The application uses GitHub Actions to automatically build and publish releases when you push a version tag.

### Creating a Release

1. **Update the version** in `src/frontend/package.json`:
   ```json
   {
     "version": "1.0.7"
   }
   ```

2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.7"
   ```

3. **Create and push a version tag**:
   ```bash
   git tag v1.0.7
   git push origin main
   git push origin v1.0.7
   ```

4. **Monitor the build**:
   - Go to the Actions tab in your GitHub repository
   - Watch the "Build and Release Electron App" workflow
   - The workflow will:
     - Build the app for Windows (x64)
     - Build the app for macOS (x64 + arm64)
     - Create a GitHub release with the tag name
     - Upload all installers to the release

5. **Release artifacts**:
   - **Windows**: `.exe` installer (NSIS)
   - **macOS**: `.dmg` and `.zip` files (for both Intel and Apple Silicon)
   - **Auto-update files**: `latest.yml` and `latest-mac.yml`

## Manual Release (Local Build)

If you need to build locally:

### Windows
```bash
cd src/frontend
npm install
npm run electron:build:win
```

### macOS
```bash
cd src/frontend
npm install
npm run electron:build:mac
```

### All Platforms
```bash
cd src/frontend
npm install
npm run electron:build:all
```

Build artifacts will be in `src/frontend/dist/`.

## Auto-Update

The application uses `electron-updater` to check for updates automatically. When a new release is published to GitHub:

1. The app checks for updates on startup
2. Users can manually check via **File > Check for Updates**
3. Updates are downloaded and installed automatically
4. Users are prompted to restart the application

## Troubleshooting

### Build fails on GitHub Actions
- Ensure the `GH_TOKEN` secret is available (it's provided automatically by GitHub)
- Check that the repository URL in `package.json` matches your GitHub repo
- Verify all dependencies are in `package.json` (not just `devDependencies`)

### Auto-update not working
- Verify the `publish` configuration in `src/frontend/package.json`
- Ensure releases are published (not drafts)
- Check that `latest.yml` / `latest-mac.yml` files are uploaded to the release

## Version Naming Convention

Use semantic versioning: `vMAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes

Examples: `v1.0.0`, `v1.1.0`, `v1.1.1`
