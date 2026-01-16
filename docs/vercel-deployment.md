# Vercel Deployment Guide

Complete guide for deploying the Dashboarduz frontend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Connected to Vercel
3. **Environment Variables**: Configured in Vercel dashboard

## Initial Setup

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm build --filter web`
   - **Output Directory**: `.next`
   - **Install Command**: `cd ../.. && pnpm install --frozen-lockfile`

### 2. Configure Environment Variables

In Vercel dashboard, go to Project Settings > Environment Variables:

**Production:**
- `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com`
- `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry DSN (optional)

**Preview:**
- `NEXT_PUBLIC_API_URL`: `https://api-staging.yourdomain.com`
- `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry DSN (optional)

**Development:**
- `NEXT_PUBLIC_API_URL`: `http://localhost:3001`
- `NEXT_PUBLIC_SENTRY_DSN`: (optional)

### 3. Configure Build Settings

The `vercel.json` file is already configured with:
- Monorepo-aware build commands
- Security headers
- API rewrites
- Environment variable references

## Deployment Methods

### Automatic Deployment (Recommended)

Vercel automatically deploys:
- **Production**: On push to `main` branch
- **Preview**: On pull requests and other branches

### Manual Deployment

Using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
cd apps/web
vercel link

# Deploy to production
vercel --prod
```

### GitHub Actions Deployment

The `.github/workflows/deploy-frontend.yml` workflow automatically:
1. Runs tests
2. Builds the application
3. Deploys to Vercel production

## Monorepo Configuration

### Build Command

The build command handles the monorepo structure:

```bash
cd ../.. && pnpm install --frozen-lockfile && pnpm build --filter web
```

This ensures:
1. Dependencies are installed from the root
2. Shared packages are built first
3. Only the web app is built

### Custom Build Script

For complex builds, use `vercel-build.sh`:

```bash
#!/bin/bash
cd ../..
pnpm install --frozen-lockfile
pnpm --filter db generate
pnpm --filter shared build
cd apps/web
pnpm build
```

## Environment-Specific Configuration

### Production

- Uses production API endpoint
- Analytics enabled
- Error tracking enabled
- Optimized builds

### Preview

- Uses staging API endpoint
- Preview deployments for PRs
- Same optimizations as production

### Development

- Local development server
- Hot reload enabled
- Dev tools enabled

## Custom Domain Setup

1. **Add Domain in Vercel**:
   - Go to Project Settings > Domains
   - Add your domain (e.g., `app.yourdomain.com`)

2. **Configure DNS**:
   - Add CNAME record pointing to Vercel
   - Or use A records for apex domain

3. **SSL Certificate**:
   - Vercel automatically provisions SSL
   - Wait for DNS propagation (up to 24 hours)

## Performance Optimization

### Image Optimization

Vercel automatically optimizes images via Next.js Image component:
- Automatic format conversion (WebP, AVIF)
- Responsive image sizing
- Lazy loading

### Caching

Vercel caches:
- Static assets (CDN)
- API responses (edge caching)
- Build outputs

### Bundle Optimization

The `next.config.js` includes:
- Code splitting
- Tree shaking
- Minification
- Compression

## Monitoring & Analytics

### Vercel Analytics

Enable in Project Settings:
- Web Vitals tracking
- Real User Monitoring (RUM)
- Performance insights

### Sentry Integration

1. **Install Sentry**:
   ```bash
   pnpm add @sentry/nextjs
   ```

2. **Configure**:
   - Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel
   - Initialize in `apps/web/src/app/layout.tsx`

3. **Monitor**:
   - Errors tracked automatically
   - Performance monitoring enabled

## Troubleshooting

### Build Failures

**Issue**: Build fails with dependency errors
**Solution**: 
- Check `pnpm-lock.yaml` is committed
- Verify build command includes dependency installation
- Check Node.js version (should be 20.x)

**Issue**: Monorepo packages not found
**Solution**:
- Ensure build command runs from root
- Verify `transpilePackages` in `next.config.js`
- Check workspace configuration

### Deployment Issues

**Issue**: Environment variables not available
**Solution**:
- Verify variables are set in Vercel dashboard
- Check variable names match exactly
- Ensure `NEXT_PUBLIC_` prefix for client-side vars

**Issue**: Preview deployments not working
**Solution**:
- Check GitHub integration
- Verify workflow file is correct
- Check Vercel project settings

### Performance Issues

**Issue**: Slow page loads
**Solution**:
- Enable Vercel Analytics
- Check bundle size
- Optimize images
- Review Core Web Vitals

## Best Practices

1. **Always test in preview** before production
2. **Monitor Core Web Vitals** regularly
3. **Use feature flags** for gradual rollouts
4. **Set up alerts** for errors and performance
5. **Regular security audits**
6. **Keep dependencies updated**

## Rollback Procedure

1. **Go to Vercel Dashboard**
2. **Select deployment**
3. **Click "Promote to Production"**

Or via CLI:
```bash
vercel rollback [deployment-url]
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Monorepo Deployment](https://vercel.com/docs/monorepos)