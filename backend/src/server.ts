import validateEnv from '@utils/validateEnv';

import App from '@/app';
import { loadRuntimeConfiguration } from '@/config/katla-config';
import { controllersForMode } from '@/controllers/runtime-controllers';

validateEnv();

const app = new App(controllersForMode(loadRuntimeConfiguration().mode));
app.listen();
