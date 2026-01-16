# Troubleshooting Guide

Common issues and solutions for Dashboarduz deployment and testing.

## Deployment Issues

### Vercel Build Failures

**Issue**: Build fails with "Module not found"
**Solution**:
1. Check `pnpm-lock.yaml` is committed
2. Verify build command includes dependency installation
3. Ensure monorepo structure is correct

**Issue**: Build fails with "Cannot find module '@dashboarduz/shared'"
**Solution**:
1. Verify `transpilePackages` in `next.config.js`
2. Check workspace configuration in `pnpm-workspace.yaml`
3. Ensure shared package is built before web app

**Issue**: Environment variables not available
**Solution**:
1. Check variables are set in Vercel dashboard
2. Verify variable names match exactly (case-sensitive)
3. Ensure `NEXT_PUBLIC_` prefix for client-side variables
4. Redeploy after adding variables

### GitHub Actions Failures

**Issue**: Workflow fails with "pnpm: command not found"
**Solution**:
1. Verify `pnpm/action-setup@v2` is in workflow
2. Check PNPM_VERSION is set correctly
3. Ensure action version is up to date

**Issue**: Tests fail in CI but pass locally
**Solution**:
1. Check Node.js version matches CI
2. Verify environment variables are set
3. Check for platform-specific issues
4. Review test logs for specific errors

## Testing Issues

### Jest Test Failures

**Issue**: "Cannot find module" errors
**Solution**:
1. Clear Jest cache: `pnpm test --clearCache`
2. Reinstall dependencies: `pnpm install`
3. Check `moduleNameMapper` in `jest.config.js`

**Issue**: Tests timeout
**Solution**:
1. Increase timeout in test: `jest.setTimeout(10000)`
2. Check for infinite loops
3. Verify mocks are working correctly

**Issue**: "window is not defined" errors
**Solution**:
1. Ensure `jest-environment-jsdom` is configured
2. Check `testEnvironment` in `jest.config.js`
3. Mock window object if needed

### Cypress Issues

**Issue**: Tests fail with "cy.visit() failed"
**Solution**:
1. Verify Next.js server is running
2. Check `baseUrl` in `cypress.config.ts`
3. Ensure port 3000 is available

**Issue**: Elements not found
**Solution**:
1. Add wait: `cy.wait(1000)`
2. Use `cy.get()` with timeout
3. Check element selectors are correct

**Issue**: Authentication tests fail
**Solution**:
1. Verify auth mocks are set up
2. Check localStorage/sessionStorage
3. Ensure auth tokens are valid

## Environment Issues

### Environment Variables

**Issue**: Variables not loading
**Solution**:
1. Check `.env.local` file exists
2. Verify variable names match
3. Restart development server
4. Check for typos in variable names

**Issue**: Variables available in dev but not production
**Solution**:
1. Set variables in Vercel dashboard
2. Ensure `NEXT_PUBLIC_` prefix for client-side
3. Redeploy after adding variables

### API Connection Issues

**Issue**: Cannot connect to API
**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set
2. Check API server is running
3. Verify CORS is configured
4. Check network/firewall settings

## Performance Issues

### Slow Build Times

**Solution**:
1. Enable build caching
2. Optimize dependencies
3. Use Turbopack (experimental)
4. Check for unnecessary imports

### Slow Page Loads

**Solution**:
1. Enable Vercel Analytics
2. Optimize images
3. Check bundle size
4. Review Core Web Vitals
5. Enable compression

## Common Errors

### "Hydration failed"

**Solution**:
1. Check for mismatched HTML
2. Verify server/client rendering matches
3. Check for browser extensions
4. Review component code

### "Module parse failed"

**Solution**:
1. Check file extensions
2. Verify webpack configuration
3. Check for syntax errors
4. Rebuild node_modules

### "Cannot read property of undefined"

**Solution**:
1. Add null checks
2. Verify data structure
3. Check API responses
4. Add error boundaries

## Getting Help

1. **Check Logs**:
   - Vercel deployment logs
   - GitHub Actions logs
   - Browser console
   - Server logs

2. **Review Documentation**:
   - Vercel deployment guide
   - Testing guide
   - API documentation

3. **Search Issues**:
   - GitHub issues
   - Stack Overflow
   - Vercel community

4. **Create Issue**:
   - Include error messages
   - Provide reproduction steps
   - Share relevant logs
   - Include environment details