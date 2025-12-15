import { getApiBase } from '@/config/api-config';
import { OrganizationTree } from '@/data-contracts/mdviewer/data-contracts';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { OrgLeafNodeDTO, OrgSearchResponseDTO, OrgTreeNodeDTO } from '@/responses/organization.response';
import ApiService from '@/services/api.service';
import { Controller, Get, Param, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Controller()
export class OrganizationController {
  private apiService = new ApiService();
  private apiBase = getApiBase('mdviewer');

  @Get('/organization/search/:searchString')
  @OpenAPI({ summary: 'Search organizations by name' })
  @UseBefore(authMiddleware)
  @ResponseSchema(OrgSearchResponseDTO)
  async searchOrganizations(@Req() req: RequestWithUser, @Param('searchString') searchString: string): Promise<OrgSearchResponseDTO> {
    const url = `${this.apiBase}/${encodeURIComponent(searchString)}/search`;

    try {
      const res = await this.apiService.get<OrgSearchResponseDTO>({ url }, req);
      return res.data || { organizations: [], persons: [], responsibilities: [] };
    } catch (error: any) {
      return { organizations: [], persons: [], responsibilities: [] };
    }
  }

  @Get('/organization/:orgId/orgtree')
  @OpenAPI({ summary: 'Get organization tree from orgId' })
  @UseBefore(authMiddleware)
  @ResponseSchema(OrgTreeNodeDTO)
  async getOrgTree(@Req() req: RequestWithUser, @Param('orgId') orgId: number): Promise<OrgTreeNodeDTO | null> {
    const url = `${this.apiBase}/${orgId}/orgtree`;

    try {
      const res = await this.apiService.get<OrganizationTree>({ url }, req);
      return res.data || null;
    } catch (error: any) {
      return null;
    }
  }

  @Get('/organization/:orgId/leafnodes')
  @OpenAPI({ summary: 'Get leaf nodes from organization tree' })
  @UseBefore(authMiddleware)
  @ResponseSchema(OrgLeafNodeDTO)
  async getLeafNodes(@Req() req: RequestWithUser, @Param('orgId') orgId: number): Promise<OrgLeafNodeDTO[]> {
    const tree = await this.getOrgTree(req, orgId);
    if (!tree) return [];

    return this.flattenToLeafNodes(tree);
  }

  private flattenToLeafNodes(node: OrganizationTree): OrgLeafNodeDTO[] {
    const leafNodes: OrgLeafNodeDTO[] = [];

    const traverse = (n: OrganizationTree) => {
      if (n.isLeafLevel && n.orgId && n.orgName) {
        leafNodes.push({
          orgId: n.orgId,
          orgName: n.orgName,
          parentId: n.parentId ?? undefined,
        });
      }
      if (n.organizations) {
        n.organizations.forEach(traverse);
      }
    };

    traverse(node);
    return leafNodes;
  }
}
