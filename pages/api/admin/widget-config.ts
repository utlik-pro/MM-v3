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

interface WidgetsResponse {
  widgets: WidgetConfig[];
  message?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<WidgetsResponse | { error: string }>
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - return all widgets
  if (req.method === 'GET') {
    return res.status(200).json({
      widgets: widgetsConfig.widgets as WidgetConfig[]
    });
  }

  // PATCH - update widget (note: changes require redeploy to take effect)
  if (req.method === 'PATCH') {
    const { id, enabled } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Widget ID is required' });
    }

    const widget = widgetsConfig.widgets.find((w: WidgetConfig) => w.id === id);

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    // Note: In a JSON file setup, we can't actually modify the file at runtime
    // This endpoint returns what the new state would be
    // To actually change the config, you need to:
    // 1. Edit config/widgets.json
    // 2. Commit and push
    // 3. Wait for Vercel redeploy

    return res.status(200).json({
      widgets: widgetsConfig.widgets.map((w: WidgetConfig) =>
        w.id === id ? { ...w, enabled: enabled ?? w.enabled } : w
      ) as WidgetConfig[],
      message: 'Config preview. To apply changes, edit config/widgets.json and redeploy.'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
