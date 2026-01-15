// AmoCRM integration service
// Handles OAuth2, token refresh, webhook processing, and API calls

export interface AmoCRMTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export class AmoCRMService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl: string;

  constructor() {
    this.clientId = process.env.AMOCRM_CLIENT_ID || '';
    this.clientSecret = process.env.AMOCRM_CLIENT_SECRET || '';
    this.redirectUri = process.env.AMOCRM_REDIRECT_URI || '';
    this.baseUrl = process.env.AMOCRM_BASE_URL || 'https://www.amocrm.ru';
  }

  // Get OAuth2 authorization URL
  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: state || '',
    });
    return `${this.baseUrl}/oauth?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCode(code: string): Promise<AmoCRMTokens> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth2/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AmoCRM] Token exchange error:', errorText);
        throw new Error(`Failed to exchange code for tokens: ${response.status} ${response.statusText}`);
      }

      const tokens = await response.json();
      
      // Validate required fields
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Invalid token response from AmoCRM');
      }

      return tokens;
    } catch (error: any) {
      console.error('[AmoCRM] Exchange code error:', error);
      throw new Error(`AmoCRM OAuth failed: ${error.message}`);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AmoCRMTokens> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth2/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AmoCRM] Token refresh error:', errorText);
        throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
      }

      const tokens = await response.json();
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Invalid token refresh response from AmoCRM');
      }

      return tokens;
    } catch (error: any) {
      console.error('[AmoCRM] Refresh token error:', error);
      throw new Error(`AmoCRM token refresh failed: ${error.message}`);
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // AmoCRM signs webhooks with HMAC-SHA256
      // The signature is calculated from the raw request body
      // In production, you would:
      // 1. Get the webhook secret from your AmoCRM app settings
      // 2. Calculate HMAC-SHA256 of the raw request body
      // 3. Compare with the signature header
      
      const webhookSecret = process.env.AMOCRM_WEBHOOK_SECRET || '';
      
      if (!webhookSecret) {
        console.warn('[AmoCRM] Webhook secret not configured, skipping signature verification');
        return true; // Allow in development
      }

      // For now, return true (implement proper verification in production)
      // TODO: Implement proper HMAC-SHA256 verification
      return true;
    } catch (error) {
      console.error('[AmoCRM] Webhook signature verification error:', error);
      return false;
    }
  }

  // Fetch leads from AmoCRM (polling fallback)
  async fetchLeads(accessToken: string, accountId: string, params?: {
    page?: number;
    limit?: number;
    with?: string;
    filter?: any;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.with) queryParams.set('with', params.with);

      const url = `${this.baseUrl}/api/v4/leads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AmoCRM] Fetch leads error:', errorText);
        throw new Error(`Failed to fetch leads from AmoCRM: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data._embedded || !data._embedded.leads) {
        throw new Error('Invalid response structure from AmoCRM');
      }

      return data;
    } catch (error: any) {
      console.error('[AmoCRM] Fetch leads error:', error);
      throw new Error(`Failed to fetch AmoCRM leads: ${error.message}`);
    }
  }

  // Fetch contacts from AmoCRM
  async fetchContacts(accessToken: string, accountId: string, params?: {
    page?: number;
    limit?: number;
    query?: string;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.query) queryParams.set('query', params.query);

      const url = `${this.baseUrl}/api/v4/contacts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AmoCRM] Fetch contacts error:', errorText);
        throw new Error(`Failed to fetch contacts from AmoCRM: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data._embedded || !data._embedded.contacts) {
        throw new Error('Invalid response structure from AmoCRM');
      }

      return data;
    } catch (error: any) {
      console.error('[AmoCRM] Fetch contacts error:', error);
      throw new Error(`Failed to fetch AmoCRM contacts: ${error.message}`);
    }
  }

  // Create lead in AmoCRM
  async createLead(accessToken: string, leadData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v4/leads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([leadData]),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AmoCRM] Create lead error:', errorText);
        throw new Error(`Failed to create lead in AmoCRM: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[AmoCRM] Create lead error:', error);
      throw new Error(`Failed to create AmoCRM lead: ${error.message}`);
    }
  }

  // Update lead in AmoCRM
  async updateLead(accessToken: string, leadId: number, leadData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v4/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AmoCRM] Update lead error:', errorText);
        throw new Error(`Failed to update lead in AmoCRM: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[AmoCRM] Update lead error:', error);
      throw new Error(`Failed to update AmoCRM lead: ${error.message}`);
    }
  }
}

export const amocrmService = new AmoCRMService();
