import { Controller, Get } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

/** Liveness för båda lägen. Externa anslutningar kontrolleras separat med katla:check --connected. */
@Controller()
export class HealthController {
  @Get('/health/up')
  @OpenAPI({ summary: 'Return process health without requiring upstream credentials' })
  up(): { status: string } {
    return { status: 'OK' };
  }
}
