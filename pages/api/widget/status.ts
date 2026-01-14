import type { NextApiRequest, NextApiResponse } from 'next';
import widgetsConfig from '../../../config/widgets.json';

interface WidgetConfig {
  id: string;
  domain: string;
  name: string;
  enabled: boolean;
  theme: string;
  phone: string;
}

interface StatusResponse {
  enabled: boolean;
  config?: {
    theme: string;
    phone: string;
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ enabled: true });
  }

  const domain = (req.query.domain as string) || '';

  // Find widget config by domain
  const widget = widgetsConfig.widgets.find(
    (w: WidgetConfig) => w.domain === domain || domain.endsWith(w.domain)
  );

  if (!widget) {
    // Domain not found - fail-open (show widget)
    return res.status(200).json({ enabled: true });
  }

  return res.status(200).json({
    enabled: widget.enabled,
    config: {
      theme: widget.theme,
      phone: widget.phone
    }
  });
}
