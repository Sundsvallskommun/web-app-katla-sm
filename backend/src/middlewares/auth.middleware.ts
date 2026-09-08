import { HttpException } from '@exceptions/HttpException';
import { NextFunction, Request, Response } from 'express';

import { loadRuntimeConfiguration, readCataloguePolicy } from '@/config/katla-config';
import { assertSessionAccess } from '@/services/authorization.service';
import { logger } from '@/utils/logger';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!req.isAuthenticated()) {
    next(new HttpException(401, 'NOT_AUTHORIZED'));
    return;
  }
  try {
    const configuration = loadRuntimeConfiguration();
    assertSessionAccess(req.user, configuration, readCataloguePolicy(configuration));
    next();
  } catch (error) {
    if (error instanceof HttpException) {
      next(error);
      return;
    }
    logger.error('Application access policy could not be validated');
    next(new HttpException(503, 'ACCESS_POLICY_UNAVAILABLE'));
  }
};

export default authMiddleware;
