import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';
import { SupportManagementController } from './controllers/supportmanagement.controller';

validateEnv();

const app = new App([IndexController, UserController, HealthController, SupportManagementController]);

app.listen();
