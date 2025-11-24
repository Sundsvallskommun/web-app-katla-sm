import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { PortalPersonData } from '@/data-contracts/employee/data-contracts';
import { Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import ApiService from '@/services/api.service';
import { Controller, Get, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

@Controller()
export class EmployeeController {
  private apiService = new ApiService();
  private apiBase = getApiBase('employee');

  @Get('/employee/personal')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  async getErrand(@Req() req: RequestWithUser): Promise<Stakeholder> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/portalpersondata/personal/${req.user.username}`;

    try {
      const res = await this.apiService.get<PortalPersonData>({ url }, req);

      if (!res.data) throw new HttpException(500, 'No data from API');

      const stakeholder: Stakeholder = {
        externalId: res.data.personid,
        city: res.data.city,
        firstName: res.data.givenname,
        lastName: res.data.lastname,
        address: res.data.address,
        zipCode: res.data.postalCode,
        contactChannels: [
          {
            type: 'PHONE',
            value: res.data.workPhone || res.data.mobilePhone || res.data.extraMobilePhone,
          },
          {
            type: 'EMAIL',
            value: res.data.email,
          },
        ],
      };

      return stakeholder;
    } catch (error: any) {
      return {};
    }
  }
}
