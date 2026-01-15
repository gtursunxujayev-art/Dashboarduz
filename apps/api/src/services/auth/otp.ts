// OTP service abstraction - supports Firebase Auth or Twilio Verify

export interface OTPProvider {
  sendOTP(phone: string): Promise<{ success: boolean; messageId?: string }>;
  verifyOTP(phone: string, code: string): Promise<{ success: boolean; verified: boolean }>;
}

// Firebase Auth implementation
class FirebaseOTPProvider implements OTPProvider {
  private admin: any;

  constructor() {
    // Initialize Firebase Admin SDK
    // Note: In production, you would initialize with service account credentials
    this.admin = null;
    
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      try {
        // This would be initialized with actual Firebase Admin SDK
        // For now, we'll use a placeholder
        console.log('[Firebase OTP] Initialized (placeholder)');
      } catch (error) {
        console.error('[Firebase OTP] Failed to initialize:', error);
      }
    }
  }

  async sendOTP(phone: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      // In production, this would use Firebase Admin SDK
      // const result = await this.admin.auth().generateSignInWithPhoneNumber(phone, {});
      
      // For now, simulate successful OTP send
      console.log(`[Firebase OTP] Sending OTP to ${phone}`);
      
      // Store verification code in memory (in production, use Redis)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const sessionId = `session_${Date.now()}_${phone}`;
      
      // Store in memory (in production, use Redis with expiration)
      (global as any).otpSessions = (global as any).otpSessions || {};
      (global as any).otpSessions[sessionId] = {
        phone,
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      };

      return { 
        success: true, 
        messageId: sessionId,
        // In production, Firebase would send the SMS
      };
    } catch (error: any) {
      console.error('[Firebase OTP] Send error:', error);
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }

  async verifyOTP(phone: string, code: string): Promise<{ success: boolean; verified: boolean }> {
    try {
      // In production, this would verify with Firebase
      // const result = await this.admin.auth().verifyPhoneNumber(phone, code);
      
      // For now, check against stored sessions
      const sessions = (global as any).otpSessions || {};
      const sessionId = Object.keys(sessions).find(key => 
        sessions[key].phone === phone && 
        sessions[key].code === code &&
        sessions[key].expiresAt > Date.now()
      );

      if (sessionId) {
        // Clean up session
        delete (global as any).otpSessions[sessionId];
        return { success: true, verified: true };
      }

      return { success: true, verified: false };
    } catch (error: any) {
      console.error('[Firebase OTP] Verify error:', error);
      return { success: false, verified: false };
    }
  }
}

// Twilio Verify implementation
class TwilioOTPProvider implements OTPProvider {
  private accountSid: string;
  private authToken: string;
  private serviceSid: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';
  }

  async sendOTP(phone: string): Promise<{ success: boolean; messageId?: string }> {
    // TODO: Implement Twilio Verify API
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${this.serviceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, Channel: 'sms' }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send OTP via Twilio');
    }

    const data = await response.json();
    return { success: true, messageId: data.sid };
  }

  async verifyOTP(phone: string, code: string): Promise<{ success: boolean; verified: boolean }> {
    try {
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${this.serviceSid}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: phone, Code: code }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Twilio OTP] Verify error:', error);
        return { success: false, verified: false };
      }

      const data = await response.json();
      return { success: true, verified: data.status === 'approved' };
    } catch (error: any) {
      console.error('[Twilio OTP] Verify exception:', error);
      return { success: false, verified: false };
    }
  }
}

// Factory to get OTP provider based on env
export function getOTPProvider(): OTPProvider {
  const provider = process.env.OTP_PROVIDER || 'firebase';
  
  switch (provider) {
    case 'twilio':
      return new TwilioOTPProvider();
    case 'firebase':
    default:
      return new FirebaseOTPProvider();
  }
}

export const otpService = getOTPProvider();
