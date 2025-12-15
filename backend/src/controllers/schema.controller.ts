import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import ApiService from '@/services/api.service';
import { apiURL } from '@/utils/util';
import { Response } from 'express';
import { Controller, Get, Param, Req, Res, UseBefore } from 'routing-controllers';
import * as fs from 'fs';
import * as path from 'path';

interface TemplateResponse {
  identifier: string;
  version: string;
  content: string;
  name: string;
}

@Controller()
export class SchemaController {
  private apiService = new ApiService();
  private apiBase = getApiBase('templating');

  // Try to load schema from local file (for development/testing)
  private tryLoadLocalSchema(schemaName: string): { schema: unknown; uiSchema: unknown } | null {
    const localPath = path.join(__dirname, '..', '..', 'schemas', `${schemaName}.json`);
    try {
      if (fs.existsSync(localPath)) {
        const content = fs.readFileSync(localPath, 'utf-8');
        const { schema, uiSchema } = JSON.parse(content);
        console.log(`Loaded schema from local file: ${localPath}`);
        return { schema, uiSchema: uiSchema ?? {} };
      }
    } catch (err) {
      console.log(`Could not load local schema: ${err}`);
    }
    return null;
  }

  @Get('/schemas/:schemaName')
  @UseBefore(authMiddleware)
  async getSchema(@Param('schemaName') schemaName: string, @Req() req: RequestWithUser, @Res() response: Response): Promise<Response> {
    const baseURL = apiURL(this.apiBase);
    const url = `${MUNICIPALITY_ID}/templates/${schemaName}`;

    try {
      const res = await this.apiService.get<TemplateResponse>({ baseURL, url }, req);

      // Decode base64 content
      console.log('Schema content (base64):', res.data.content);
      const decoded = Buffer.from(res.data.content, 'base64').toString('utf-8');
      const { schema, uiSchema } = JSON.parse(decoded);

      return response.json({ schema, uiSchema: uiSchema ?? {} });
    } catch (error) {
      console.log('Templating service failed, trying local fallback...');

      // Try local fallback
      const localSchema = this.tryLoadLocalSchema(schemaName);
      if (localSchema) {
        return response.json(localSchema);
      }

      console.error('Error loading schema:', error);
      return response.status(500).json({
        error: 'Failed to load schema',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
