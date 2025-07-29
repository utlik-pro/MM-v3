import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Создаем клиента
  const client = await prisma.client.upsert({
    where: { id: 'default-client' },
    update: {},
    create: {
      id: 'default-client',
      name: 'MinskMir Voice Agency',
      domain: 'minskmir.by',
      settings: JSON.stringify({
        timezone: 'Europe/Minsk',
        language: 'ru'
      })
    }
  })

  // Создаем агента
  const agent = await prisma.agent.upsert({
    where: { 
      clientId_externalId: {
        clientId: client.id,
        externalId: 'agent_01jxkr0mstfk6ttayjsghjm7xc'
      }
    },
    update: {},
    create: {
      clientId: client.id,
      externalId: 'agent_01jxkr0mstfk6ttayjsghjm7xc',
      name: 'MinskMir Voice Assistant',
      description: 'Голосовой ассистент для захвата лидов',
      isActive: true
    }
  })

  // Создаем тестовые лиды
  const leads = [
    {
      id: 'lead_1',
      clientId: client.id,
      agentId: agent.id,
      contactInfo: JSON.stringify({
        name: 'Иван Петров',
        phone: '+375 29 123-45-67',
        email: 'ivan.petrov@example.com'
      }),
      source: 'voice_widget',
      status: 'NEW' as const,
      score: 85,
      notes: 'Интересуется услугами, просил перезвонить'
    },
    {
      id: 'lead_2',
      clientId: client.id,
      agentId: agent.id,
      contactInfo: JSON.stringify({
        name: 'Мария Сидорова',
        phone: '+375 33 987-65-43',
        email: 'maria.sidorova@example.com'
      }),
      source: 'voice_widget',
      status: 'CONTACTED' as const,
      score: 92,
      notes: 'Высокий интерес, назначена встреча'
    },
    {
      id: 'lead_3',
      clientId: client.id,
      agentId: agent.id,
      contactInfo: JSON.stringify({
        name: 'Алексей Михайлов',
        phone: '+375 25 555-77-88',
        email: 'alex.mikhailov@gmail.com'
      }),
      source: 'voice_widget',
      status: 'QUALIFIED' as const,
      score: 95,
      notes: 'Готов к покупке, обсуждаем детали'
    },
    {
      id: 'lead_4',
      clientId: client.id,
      agentId: agent.id,
      contactInfo: JSON.stringify({
        name: 'Елена Козлова',
        phone: '+375 44 111-22-33'
      }),
      source: 'voice_widget',
      status: 'NEW' as const,
      score: 70,
      notes: 'Первичный контакт, требует уточнения потребностей'
    },
    {
      id: 'lead_5',
      clientId: client.id,
      agentId: agent.id,
      contactInfo: JSON.stringify({
        name: 'Дмитрий Волков',
        phone: '+375 29 999-88-77',
        email: 'dmitry.volkov@company.by'
      }),
      source: 'voice_widget',
      status: 'CONVERTED' as const,
      score: 100,
      notes: 'Успешная конверсия! Клиент подписал договор'
    }
  ]

  for (const leadData of leads) {
    await prisma.lead.upsert({
      where: { id: leadData.id },
      update: {},
      create: leadData
    })
  }

  // Создаем тестовые разговоры
  const conversations = [
    {
      id: 'conv_1',
      clientId: client.id,
      agentId: agent.id,
      externalId: 'conv_elevenlabs_123',
      status: 'COMPLETED' as const,
      startedAt: new Date(Date.now() - 3600000), // 1 час назад
      endedAt: new Date(Date.now() - 3300000), // 55 минут назад
      duration: 300, // 5 минут
      transcript: 'Пользователь спросил о ваших услугах и оставил контакты для связи',
      summary: 'Потенциальный клиент заинтересован в услугах'
    },
    {
      id: 'conv_2',
      clientId: client.id,
      agentId: agent.id,
      externalId: 'conv_elevenlabs_124',
      status: 'COMPLETED' as const,
      startedAt: new Date(Date.now() - 1800000), // 30 минут назад
      endedAt: new Date(Date.now() - 1600000), // 26 минут назад
      duration: 240, // 4 минуты
      transcript: 'Клиент уточнял цены и условия сотрудничества',
      summary: 'Квалифицированный лид, готов к дальнейшему общению'
    }
  ]

  for (const convData of conversations) {
    await prisma.conversation.upsert({
      where: { id: convData.id },
      update: {},
      create: convData
    })
  }

  console.log('✅ База данных заполнена тестовыми данными')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 