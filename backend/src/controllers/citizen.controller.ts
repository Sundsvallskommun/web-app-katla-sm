import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { CitizenExtended } from '@/data-contracts/citizen/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { StakeholderDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';
import { addHyphenToPersonNumber } from '@/utils/stakeholder-mapping';
import { Controller, Get, Param, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

@Controller()
export class CitizenController {
  private apiService = new ApiService();
  private apiBase = getApiBase('citizen');

  @Get('/citizen/person/:personNumber')
  @OpenAPI({ summary: 'Get stakeholder using personNumber' })
  @UseBefore(authMiddleware)
  async getErrand(@Req() req: RequestWithUser, @Param('personNumber') personNumber: string): Promise<StakeholderDTO> {
    const personIdUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${personNumber}/guid/`;

    try {
      const personNumberRes = await this.apiService.get<string>({ url: personIdUrl }, req);
      const personInformationUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${personNumberRes.data}`;
      const res = await this.apiService.get<CitizenExtended>({ url: personInformationUrl }, req);
      if (!res.data) throw new HttpException(500, 'No data from API');

      const stakeholder: StakeholderDTO = {
        externalId: res.data.personId,
        city: res.data.addresses[0].city,
        firstName: res.data.givenname,
        lastName: res.data.lastname,
        address: res.data.addresses[0].address,
        zipCode: res.data.addresses[0].postalCode,
        personNumber: addHyphenToPersonNumber(personNumber),
        careOf: res.data.addresses[0].co,
        country: res.data.addresses[0].country,
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
