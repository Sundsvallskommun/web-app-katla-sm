import { getKatlaDefinition } from '@katla/definitions';
import { Controller, Get, Header, Req, UseBefore } from 'routing-controllers';
import { ResponseSchema } from 'routing-controllers-openapi';

import { canAccessApplication } from '@/config/catalogue-policy';
import { loadRuntimeConfiguration, readCataloguePolicy } from '@/config/katla-config';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { AppContextResponseDTO, ApplicationsResponseDTO } from '@/responses/application.response';

@Controller()
export class ApplicationController {
  @Get('/app-context')
  @Header('Cache-Control', 'no-store')
  @ResponseSchema(AppContextResponseDTO)
  getAppContext(): AppContextResponseDTO {
    const configuration = loadRuntimeConfiguration();
    const policy = readCataloguePolicy(configuration);
    return {
      data: {
        mode: configuration.mode,
        ...(configuration.mode === 'katla' ? { katlaId: configuration.katlaId, definitionRevision: configuration.definitionRevision } : {}),
        catalogueUrl: policy.catalogueUrl,
      },
      message: 'success',
    };
  }

  @Get('/applications')
  @UseBefore(authMiddleware)
  @ResponseSchema(ApplicationsResponseDTO)
  getApplications(@Req() req: RequestWithUser): ApplicationsResponseDTO {
    const configuration = loadRuntimeConfiguration();
    const policy = readCataloguePolicy(configuration);
    return {
      data: policy.applications
        .filter(application => application.published && canAccessApplication(policy, application.id, req.user.groups))
        .map(application => {
          const definition = getKatlaDefinition(application.id, { allowTestDefinitions: configuration.allowTestDefinitions });
          return { id: definition.id, applicationName: definition.applicationName, description: definition.description, url: application.url };
        }),
      message: 'success',
    };
  }
}
