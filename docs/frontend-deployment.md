# Frontend Deployment Guide

This guide covers deploying the Dashboarduz Next.js frontend to production.

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for Next.js applications due to:
- Zero-configuration deployment
- Automatic SSL certificates
- Global CDN
- Edge functions support
- Preview deployments

### Option 2: Docker + ECS/Cloud Run

For self-hosted deployments or when using the same infrastructure as the API.

## Vercel Deployment

### Prerequisites

1. **Vercel account** (sign up at vercel.com)
2. **GitHub repository** connected
3. **Environment variables** configured

### Initial Setup

1. **Install Vercel CLI** (optional, for local testing):
   ```bash
   npm i -g vercel
   ```

2. **Link project to Vercel**:
   ```bash
   cd apps/web
   vercel link
   ```

3. **Configure environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: API endpoint URL
   - `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN (optional)

### Automatic Deployment

Vercel automatically deploys on:
- **Push to main branch**: Production deployment
- **Pull requests**: Preview deployments
- **Other branches**: Preview deployments

### Manual Deployment

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Environment-Specific Configuration

#### Production

```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://api.yourdomain.com

vercel env add NEXT_PUBLIC_SENTRY_DSN production
# Enter: Your Sentry DSN
```

#### Staging

```bash
# Set staging environment variables
vercel env add NEXT_PUBLIC_API_URL staging
# Enter: https://api-staging.yourdomain.com
```

### Custom Domain

1. **Add domain in Vercel dashboard**:
   - Go to Project Settings > Domains
   - Add your domain (e.g., `app.yourdomain.com`)

2. **Configure DNS**:
   - Add CNAME record pointing to Vercel
   - Or use A records for apex domain

3. **SSL Certificate**:
   - Vercel automatically provisions SSL certificates
   - Wait for DNS propagation (up to 24 hours)

## Docker Deployment

### Build Docker Image

```bash
# Build frontend image
docker build -f apps/web/Dockerfile -t dashboarduz-web:latest .

# Tag for registry
docker tag dashboarduz-web:latest your-registry/dashboarduz-web:latest

# Push to registry
docker push your-registry/dashboarduz-web:latest
```

### Deploy to ECS

1. **Create ECS task definition** (see `task-definition-web.json`)
2. **Create ECS service**:
   ```bash
   aws ecs create-service \
     --cluster dashboarduz-production \
     --service-name dashboarduz-web \
     --task-definition dashboarduz-web \
     --desired-count 2 \
     --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:... \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
   ```

### Deploy to Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/your-project/dashboarduz-web

# Deploy to Cloud Run
gcloud run deploy dashboarduz-web \
  --image gcr.io/your-project/dashboarduz-web \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## GitHub Actions Deployment

### Vercel Integration

Vercel automatically deploys via GitHub integration. For manual control:

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Performance Optimization

### Build Optimization

1. **Enable standalone output** (already configured):
   ```js
   output: 'standalone'
   ```

2. **Image optimization**:
   - Use Next.js Image component
   - Configure image domains in `next.config.js`

3. **Code splitting**:
   - Use dynamic imports for large components
   - Implement route-based code splitting

### Caching Strategy

1. **Static assets**: Cached by CDN
2. **API responses**: Use SWR or React Query
3. **Service Worker**: For offline support (optional)

## Security Headers

Security headers are configured in:
- `vercel.json` (for Vercel)
- `next.config.js` (for other platforms)

Headers include:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy
- Referrer-Policy
- Permissions-Policy

## Monitoring

### Vercel Analytics

Enable in Vercel dashboard:
- Web Vitals tracking
- Real User Monitoring (RUM)
- Performance insights

### Sentry Integration

1. **Install Sentry**:
   ```bash
   pnpm add @sentry/nextjs
   ```

2. **Configure**:
   ```js
   // sentry.client.config.js
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

## Troubleshooting

### Build Failures

1. **Check build logs** in Vercel dashboard
2. **Verify environment variables**
3. **Check for TypeScript errors**:
   ```bash
   pnpm type-check
   ```

### Deployment Issues

1. **Verify Vercel project settings**
2. **Check GitHub integration**
3. **Review deployment logs**

### Performance Issues

1. **Analyze bundle size**:
   ```bash
   ANALYZE=true pnpm build
   ```

2. **Check Core Web Vitals** in Vercel Analytics
3. **Optimize images and assets**

## Rollback

### Vercel Rollback

1. **Go to Vercel dashboard**
2. **Select deployment**
3. **Click "Promote to Production"**

### Docker Rollback

```bash
# Update ECS service to previous task definition
aws ecs update-service \
  --cluster dashboarduz-production \
  --service dashboarduz-web \
  --task-definition dashboarduz-web:previous
```

## Best Practices

1. **Always test in preview** before production
2. **Monitor Core Web Vitals**
3. **Use feature flags** for gradual rollouts
4. **Set up alerts** for errors and performance
5. **Regular security audits**
6. **Keep dependencies updated**

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
