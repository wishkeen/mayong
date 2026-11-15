import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  appBaseUrl,
  analytics: { enabled: Boolean(appId) }
});

const coreIntegration = base44?.integrations?.Core ?? {};

if (!coreIntegration.UploadPublicFile) {
  coreIntegration.UploadPublicFile = async ({ file }) => {
    if (base44?.integrations?.core?.uploadPublicFile) {
      return base44.integrations.core.uploadPublicFile({ file });
    }
    if (base44?.core?.uploadPublicFile) {
      return base44.core.uploadPublicFile({ file });
    }
    throw new Error('Public file upload is not available in this Base44 SDK build.');
  };
}

if (!base44.integrations) {
  base44.integrations = {};
}
base44.integrations.Core = coreIntegration;
