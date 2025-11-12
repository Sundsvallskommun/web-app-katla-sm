import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { ClientUser } from '@/interfaces/users.interface';
import { UserApiResponse } from '@/responses/user.response';
import authMiddleware from '@middlewares/auth.middleware';
import { Controller, Get, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class UserController {
  @Get('/me')
  @OpenAPI({
    summary: 'Return current user',
  })
  @ResponseSchema(UserApiResponse)
  @UseBefore(authMiddleware)
  async getUser(@Req() req: RequestWithUser, @Res() response: any): Promise<ClientUser> {
    const { name, username } = req.user;

    if (!name) {
      throw new HttpException(400, 'Bad Request');
    }

    const userData: ClientUser = {
      name: name,
      username: username,
    };

    return response.send({ data: userData, message: 'success' });
  }
}
