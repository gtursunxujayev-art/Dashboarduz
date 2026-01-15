// Google OAuth2 service implementation

import { OAuth2Client } from 'google-auth-library';

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || '';

    this.oauth2Client = new OAuth2Client(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
  }

  // Get OAuth2 authorization URL
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state || '',
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  // Exchange authorization code for tokens
  async exchangeCode(code: string): Promise<{
    tokens: any;
    userInfo: GoogleUserInfo;
  }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo = await userInfoResponse.json();

      return {
        tokens,
        userInfo,
      };
    } catch (error: any) {
      console.error('[Google Auth] Exchange error:', error);
      throw new Error(`Google OAuth failed: ${error.message}`);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<any> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error: any) {
      console.error('[Google Auth] Refresh error:', error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  // Verify ID token (for Google Sign-In)
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid ID token');
      }

      return {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
        verified_email: payload.email_verified || false,
      };
    } catch (error: any) {
      console.error('[Google Auth] Verify error:', error);
      throw new Error(`Invalid Google ID token: ${error.message}`);
    }
  }

  // Revoke token
  async revokeToken(token: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(token);
    } catch (error: any) {
      console.error('[Google Auth] Revoke error:', error);
      // Don't throw - revoke failures are not critical
    }
  }
}

export const googleAuthService = new GoogleAuthService();
