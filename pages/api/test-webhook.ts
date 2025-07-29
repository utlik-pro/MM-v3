import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    
    // Тестовые данные лида
    const testLeadData = {
      FullName: "Тест Тестович",
      Phone: "+375291234567",
      Commentary: "Тестовый лид из админ панели",
      UsrMinskMir: "test_user"
    };

    const testResults = [];

    // Тест прямого webhook
    try {
      const directResponse = await fetch(`${baseUrl}/api/webhook/crm-lead-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testLeadData)
      });

      testResults.push({
        webhook: 'CRM Lead Enhanced',
        url: `${baseUrl}/api/webhook/crm-lead-enhanced`,
        status: directResponse.status,
        success: directResponse.ok,
        response: directResponse.ok ? 'OK' : `Ошибка ${directResponse.status}`
      });
    } catch (error) {
      testResults.push({
        webhook: 'CRM Lead Enhanced',
        url: `${baseUrl}/api/webhook/crm-lead-enhanced`,
        status: 500,
        success: false,
        response: 'Ошибка соединения',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Тест proxy webhook
    try {
      const proxyResponse = await fetch(`${baseUrl}/api/webhook/proxy-crm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testLeadData)
      });

      testResults.push({
        webhook: 'Proxy CRM',
        url: `${baseUrl}/api/webhook/proxy-crm`,
        status: proxyResponse.status,
        success: proxyResponse.ok,
        response: proxyResponse.ok ? 'OK' : `Ошибка ${proxyResponse.status}`
      });
    } catch (error) {
      testResults.push({
        webhook: 'Proxy CRM',
        url: `${baseUrl}/api/webhook/proxy-crm`,
        status: 500,
        success: false,
        response: 'Ошибка соединения',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Тест monitor-leads endpoint
    try {
      const monitorResponse = await fetch(`${baseUrl}/api/monitor-leads?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      testResults.push({
        webhook: 'Monitor Leads API',
        url: `${baseUrl}/api/monitor-leads`,
        status: monitorResponse.status,
        success: monitorResponse.ok,
        response: monitorResponse.ok ? 'OK' : `Ошибка ${monitorResponse.status}`
      });
    } catch (error) {
      testResults.push({
        webhook: 'Monitor Leads API',
        url: `${baseUrl}/api/monitor-leads`,
        status: 500,
        success: false,
        response: 'Ошибка соединения',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Общий статус тестов
    const allSuccessful = testResults.every(result => result.success);
    const successCount = testResults.filter(result => result.success).length;

    // Возвращаем результаты
    return res.status(200).json({
      success: allSuccessful,
      summary: `${successCount}/${testResults.length} тестов прошли успешно`,
      timestamp: new Date().toISOString(),
      results: testResults,
      test_data: testLeadData
    });

  } catch (error) {
    console.error('Ошибка тестирования webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка тестирования webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 