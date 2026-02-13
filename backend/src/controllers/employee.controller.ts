import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Employeev2, Employment, PortalPersonData } from '@/data-contracts/employee/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { UserEmploymentDTO } from '@/responses/employee.response';
import { StakeholderDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';
import { Controller, Get, Param, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

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

  @Get('/employee/employments')
  @OpenAPI({ summary: 'Get current user employments with organization info' })
  @UseBefore(authMiddleware)
  @ResponseSchema(UserEmploymentDTO)
  async getEmployments(@Req() req: RequestWithUser): Promise<UserEmploymentDTO[]> {
    try {
      // First, get the user's personId from portalpersondata
      const personalUrl = `${this.apiBase}/${MUNICIPALITY_ID}/portalpersondata/personal/${req.user.username}`;
      const personalRes = await this.apiService.get<PortalPersonData>({ url: personalUrl }, req);

      if (!personalRes.data?.personid) {
        console.error('Could not get personId for user');
        return [];
      }

      const personId = personalRes.data.personid;

      // Then fetch employments using personId
      const employmentsUrl = `${this.apiBase}/${MUNICIPALITY_ID}/employments?PersonId=${personId}`;
      const res = await this.apiService.get<Employeev2[]>({ url: employmentsUrl }, req);

      // The response is an array of Employeev2 objects
      const employees = res.data || [];
      if (employees.length === 0 || !employees[0]?.employments) {
        return [];
      }

      // Map employments to DTOs, sorted with main employment first
      const employments: UserEmploymentDTO[] = employees[0].employments
        .filter((emp: Employment) => emp.orgId && emp.orgName)
        .map((emp: Employment) => ({
          orgId: emp.orgId,
          orgName: emp.orgName,
          topOrgId: emp.topOrgId,
          isMainEmployment: emp.isMainEmployment,
          manager: emp.manager
            ? {
                personId: emp.manager.personId,
                givenname: emp.manager.givenname,
                lastname: emp.manager.lastname,
                emailAddress: emp.manager.emailAddress,
              }
            : undefined,
        }))
        .sort((a: UserEmploymentDTO, b: UserEmploymentDTO) => {
          // Main employment first
          if (a.isMainEmployment && !b.isMainEmployment) return -1;
          if (!a.isMainEmployment && b.isMainEmployment) return 1;
          return 0;
        });

      return employments;
    } catch (error: any) {
      console.error('Failed to get employments:', error);
      return [];
    }
  }
}