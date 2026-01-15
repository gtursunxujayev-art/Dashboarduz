// Google OAuth2 routes

import express from 'express';
import { googleAuthService } from '../services/auth/google';
import { prisma } from '@dashboarduz/db';
import { signJWT } from '../services/auth/jwt';

const router = express.Router();

// Initiate Google OAuth flow
router.get('/auth', (req, res) => {
  const state = req.query.state as string || '';
  const authUrl = googleAuthService.getAuthUrl(state);
  res.redirect(authUrl);
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || typeof code !== 'string') {
      throw new Error('Missing authorization code');
    }

    // Exchange code for tokens
    const { tokens, userInfo } = await googleAuthService.exchangeCode(code);

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { googleId: userInfo.id },
    });

    let tenantId: string;
    
    if (!user) {
      // Check if user exists with this email
      user = await prisma.user.findFirst({
        where: { email: userInfo.email },
      });

      if (user) {
        // Link Google account to existing user
        await prisma.user.update({
          where: { id: user.id },
          data: { googleId: userInfo.id },
        });
        tenantId = user.tenantId;
      } else {
        // Create new tenant and user
        const tenant = await prisma.tenant.create({
          data: {
            name: `Tenant ${userInfo.name}`,
            plan: 'free',
          },
        });

        user = await prisma.user.create({
          data: {
            tenantId: tenant.id,
            email: userInfo.email,
            name: userInfo.name,
            googleId: userInfo.id,
            roles: ['Admin'],
            authProvider: 'google',
          },
        });
        
        tenantId = tenant.id;
      }
    } else {
      tenantId = user.tenantId;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Store Google tokens (encrypted in production)
    await prisma.integration.upsert({
      where: {
        tenantId_type: {
          tenantId,
          type: 'google_sheets',
        },
      },
      update: {
        status: 'active',
        config: {
          email: userInfo.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date,
        },
      },
      create: {
        tenantId,
        type: 'google_sheets',
        status: 'active',
        config: {
          email: userInfo.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date,
        },
      },
    });

    // Generate JWT token
    const jwtPayload = {
      userId: user.id,
      tenantId,
      roles: user.roles,
      email: user.email,
    };

    const token = signJWT(jwtPayload);

    // Redirect to frontend with token
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify(jwtPayload));

    res.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('[Google Auth] Callback error:', error);
    
    // Redirect to frontend with error
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('error', 'google_auth_failed');
    redirectUrl.searchParams.set('message', error.message);
    
    res.redirect(redirectUrl.toString());
  }
});

// Revoke Google access
router.post('/revoke', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    await googleAuthService.revokeToken(token);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Google Auth] Revoke error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
