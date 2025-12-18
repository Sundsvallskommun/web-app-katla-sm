import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Employeev2, PortalPersonData } from '@/data-contracts/employee/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { StakeholderDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';
import { Controller, Get, Param, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

@Controller()
export class EmployeeController {
  private apiService = new ApiService();
  private apiBase = getApiBase('employee');

  @Get('/employee/personal/:username')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  async getErrand(@Req() req: RequestWithUser, @Param('username') username: string): Promise<StakeholderDTO> {
    const personDataurl = `${this.apiBase}/${MUNICIPALITY_ID}/portalpersondata/personal/${username}`;

    try {
      const personDataRes = await this.apiService.get<PortalPersonData>({ url: personDataurl }, req);

      if (!personDataRes.data) throw new HttpException(500, 'No data from API');

      const employmentsUrl = `${this.apiBase}/${MUNICIPALITY_ID}/employments?PersonId=${personDataRes.data.personid}`;
      const employmentsRes = await this.apiService.get<Employeev2[]>({ url: employmentsUrl }, req);

      if (!employmentsRes.data) throw new HttpException(500, 'No data from API');

      const mainEmployment = employmentsRes.data[0].employments.find(e => e.isMainEmployment === true);

      const stakeholder: StakeholderDTO = {
        externalId: personDataRes.data.personid,
        city: personDataRes.data.city,
        firstName: personDataRes.data.givenname,
        lastName: personDataRes.data.lastname,
        address: personDataRes.data.address,
        zipCode: personDataRes.data.postalCode,
        emails: [personDataRes.data.email?.toLocaleLowerCase()],
        phoneNumbers: [personDataRes.data.workPhone ?? personDataRes.data.mobilePhone ?? personDataRes.data.extraMobilePhone],
        title: mainEmployment.title,
        department: mainEmployment.orgName,
      };

      return stakeholder;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      return null;
    }
  }
}
