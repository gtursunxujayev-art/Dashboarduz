// Google Sheets integration service

import { google } from 'googleapis';

export interface GoogleSheetsConfig {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}

export class GoogleSheetsService {
  private sheets: any;
  private drive: any;

  // Initialize with OAuth2 tokens
  initialize(config: GoogleSheetsConfig) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
      expiry_date: config.expiresAt,
    });

    this.sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  // Read data from spreadsheet
  async readSpreadsheet(spreadsheetId: string, range: string): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return response.data.values || [];
    } catch (error: any) {
      console.error('[Google Sheets] Read error:', error);
      throw new Error(`Failed to read spreadsheet: ${error.message}`);
    }
  }

  // Write data to spreadsheet
  async writeToSpreadsheet(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });
    } catch (error: any) {
      console.error('[Google Sheets] Write error:', error);
      throw new Error(`Failed to write to spreadsheet: ${error.message}`);
    }
  }

  // Append data to spreadsheet
  async appendToSpreadsheet(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values,
        },
      });
    } catch (error: any) {
      console.error('[Google Sheets] Append error:', error);
      throw new Error(`Failed to append to spreadsheet: ${error.message}`);
    }
  }

  // Create new spreadsheet
  async createSpreadsheet(title: string): Promise<{ id: string; url: string }> {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title,
          },
        },
      });

      return {
        id: response.data.spreadsheetId!,
        url: response.data.spreadsheetUrl!,
      };
    } catch (error: any) {
      console.error('[Google Sheets] Create error:', error);
      throw new Error(`Failed to create spreadsheet: ${error.message}`);
    }
  }

  // List spreadsheets
  async listSpreadsheets(query?: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name)',
        ...(query && { q: `name contains '${query}' and mimeType='application/vnd.google-apps.spreadsheet'` }),
      });

      return response.data.files?.map((file: any) => ({
        id: file.id,
        name: file.name,
      })) || [];
    } catch (error: any) {
      console.error('[Google Sheets] List error:', error);
      throw new Error(`Failed to list spreadsheets: ${error.message}`);
    }
  }

  // Share spreadsheet with email
  async shareSpreadsheet(spreadsheetId: string, email: string, role: 'reader' | 'writer' | 'commenter' = 'writer'): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          type: 'user',
          role,
          emailAddress: email,
        },
        sendNotificationEmail: true,
      });
    } catch (error: any) {
      console.error('[Google Sheets] Share error:', error);
      throw new Error(`Failed to share spreadsheet: ${error.message}`);
    }
  }

  // Get spreadsheet metadata
  async getSpreadsheetInfo(spreadsheetId: string): Promise<any> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false,
      });

      return response.data;
    } catch (error: any) {
      console.error('[Google Sheets] Get info error:', error);
      throw new Error(`Failed to get spreadsheet info: ${error.message}`);
    }
  }

  // Batch update (multiple operations)
  async batchUpdate(spreadsheetId: string, requests: any[]): Promise<void> {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests,
        },
      });
    } catch (error: any) {
      console.error('[Google Sheets] Batch update error:', error);
      throw new Error(`Failed to batch update spreadsheet: ${error.message}`);
    }
  }

  // Check if token is still valid
  async validateToken(): Promise<boolean> {
    try {
      // Try to list a small number of files to validate token
      await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id)',
      });
      return true;
    } catch (error: any) {
      console.error('[Google Sheets] Token validation error:', error);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
