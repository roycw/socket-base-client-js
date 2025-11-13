# How to Publish to npm

## Prerequisites

1. **Create an npm account** (if you don't have one):
   - Go to https://www.npmjs.com/signup
   - Create an account

2. **Login to npm from your terminal**:
   ```bash
   npm login
   ```
   Enter your username, password, and email when prompted.

## Pre-Publishing Checklist

Before publishing, make sure:

- [ ] Package name is available on npm (check at https://www.npmjs.com/package/socket-base-client-js)
- [ ] Update `package.json` with your repository URL (if you have one)
- [ ] Update `package.json` with your author information
- [ ] Test your package locally
- [ ] Version number is correct (follows semantic versioning)

## Publishing Steps

### 1. Check Package Name Availability

```bash
npm view socket-base-client-js
```

If it returns 404, the name is available. If it returns package info, the name is taken and you'll need to change it in `package.json`.

### 2. Test Your Package Locally

You can test your package locally before publishing:

```bash
# In the socket-base-client-js directory
npm link

# In another project where you want to test
npm link socket-base-client-js
```

### 3. Dry Run (Preview What Will Be Published)

```bash
npm publish --dry-run
```

This shows what files will be included without actually publishing.

### 4. Publish to npm

**For first-time publishing:**
```bash
npm publish
```

**For updates (after first publish):**
```bash
# Update version first (choose one):
npm version patch   # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor   # 1.0.0 -> 1.1.0 (new features)
npm version major   # 1.0.0 -> 2.0.0 (breaking changes)

# Then publish
npm publish
```

Or manually update version in `package.json` and then:
```bash
npm publish
```

### 5. Verify Publication

Check your package on npm:
```
https://www.npmjs.com/package/socket-base-client-js
```

Test installation:
```bash
npm install socket-base-client-js
```

## Publishing Scoped Packages (Optional)

If you want to publish as a scoped package (e.g., `@yourusername/socket-base-client-js`):

1. Update `package.json`:
   ```json
   {
     "name": "@yourusername/socket-base-client-js",
     ...
   }
   ```

2. Publish with public access:
   ```bash
   npm publish --access public
   ```

## Updating Your Package

After making changes:

1. **Update version**:
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Publish**:
   ```bash
   npm publish
   ```

## Unpublishing (if needed)

⚠️ **Warning**: Only unpublish within 72 hours of publishing, and only if necessary.

```bash
npm unpublish socket-base-client-js
# or for a specific version
npm unpublish socket-base-client-js@1.0.0
```

## Common Issues

### "You do not have permission to publish"
- Make sure you're logged in: `npm whoami`
- If the package name is taken, choose a different name

### "Package name too similar"
- npm has restrictions on similar package names
- Try a more unique name

### "Invalid package name"
- Package names must be lowercase
- Can contain hyphens and underscores
- Cannot start with a dot or underscore

## Best Practices

1. **Use semantic versioning** (major.minor.patch)
2. **Write a good README.md** (already done!)
3. **Add tests** before publishing
4. **Keep CHANGELOG.md** to track changes
5. **Tag releases in git** after publishing

## Quick Reference

```bash
# Login
npm login

# Check what will be published
npm publish --dry-run

# Publish
npm publish

# Update version and publish
npm version patch && npm publish

# Check if logged in
npm whoami

# View package info
npm view socket-base-client-js
```

