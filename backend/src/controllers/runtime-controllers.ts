import { ApplicationController } from './application.controller';
import { CitizenController } from './citizen.controller';
import { EmployeeController } from './employee.controller';
import { HealthController } from './health.controller';
import { IndexController } from './index.controller';
import { SchemaController } from './schema.controller';
import { SupportManagementController } from './supportmanagement.controller';
import { SupportManagementConversationController } from './supportmanagement-conversation.controller';
import { UserController } from './user.controller';

/** Kataloginstansen registrerar aldrig endpoints som kan nå ärenden eller persondata. */
export const controllersForMode = (mode: 'katla' | 'catalogue'): (new () => object)[] => {
  const identityControllers = [IndexController, UserController, HealthController, ApplicationController];
  return mode === 'catalogue'
    ? identityControllers
    : [
        ...identityControllers,
        SupportManagementController,
        SupportManagementConversationController,
        EmployeeController,
        CitizenController,
        SchemaController,
      ];
};
