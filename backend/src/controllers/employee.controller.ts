import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { PortalPersonData, Employeev2, Employment } from '@/data-contracts/employee/data-contracts';
import { Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { UserEmploymentDTO } from '@/responses/employee.response';
import ApiService from '@/services/api.service';
import { Controller, Get, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

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