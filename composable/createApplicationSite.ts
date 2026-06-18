import { postMethod } from "@/lib/actions/postMethod";
import { Site } from "@/components/ApplicationDetails/types";

const CREATE_SITE_ENDPOINT = "/api/v1/auth/web/core/site/";

export interface CreateApplicationSiteFormData {
  sitename: string;
  total_employee: number;
  postcode: string;
  address_line_1: string;
  address_line_2?: string;
  address_line_3?: string;
  address_line_4?: string;
}

export interface CreateApplicationSitePayload extends CreateApplicationSiteFormData {
  company_id: string;
}

export interface CreateApplicationSiteResponse {
  success: boolean;
  data?: Site;
  message?: string;
  errors?: unknown;
}

function mapApiResponseToSite(data: unknown): Site | undefined {
  if (data && typeof data === "object" && "id" in data) {
    const site = data as Site;
    return {
      ...site,
      meters: site.meters ?? [],
    };
  }
  return undefined;
}

/**
 * Create a site for an application via POST /api/v1/auth/web/core/site/.
 */
export async function createApplicationSite(
  payload: CreateApplicationSitePayload
): Promise<CreateApplicationSiteResponse> {
  const response = await postMethod(
    {
      is_deleted: false,
      deleted_at: null,
      is_active: true,
      sitename: payload.sitename,
      total_employee: payload.total_employee,
      postcode: payload.postcode,
      address_line_1: payload.address_line_1,
      address_line_2: payload.address_line_2 ?? "",
      address_line_3: payload.address_line_3 ?? "",
      address_line_4: payload.address_line_4 ?? "",
      company: payload.company_id,
    },
    CREATE_SITE_ENDPOINT
  );

  if (!response.success) {
    return {
      success: false,
      message: response.message || "Failed to create site",
      errors: response.errors,
    };
  }

  return {
    success: true,
    data: mapApiResponseToSite(response.data),
    message: response.message,
  };
}
