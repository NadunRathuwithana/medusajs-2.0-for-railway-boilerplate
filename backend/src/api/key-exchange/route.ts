import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { IApiKeyModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';

// Only ever returns a PUBLISHABLE key (they are public by design).
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const apiKeyModuleService: IApiKeyModuleService = req.scope.resolve(Modules.API_KEY);
    const [key] = await apiKeyModuleService.listApiKeys({ type: "publishable", title: "Webshop", revoked_at: null } as any);
    res.json(key ? { publishableApiKey: key.token } : {});
  } catch {
    res.status(500).json({ error: "Unavailable" });
  }
}
