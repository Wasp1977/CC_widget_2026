import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/analyze — LLM analysis of all reports
export async function POST() {
  try {
    const reports = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (reports.length === 0) {
      return NextResponse.json({ error: 'Нет сохранённых отчётов для анализа' }, { status: 400 });
    }

    // Build text from all reports
    const allContents = reports.map(
      (r) => `--- ${r.participantName} (${r.createdAt.toISOString()}) ---\n${r.reportText}`
    );
    const allReportsText = allContents.join('\n\n');

    const zai = await ZAI.create();

    const analysisPrompt = `Ты — UX-исследователь и аналитик. Тебе предоставлены отчёты немодерируемого тестирования прототипа виджета контакт-центра виртуальной АТС.

Каждый отчёт содержит оценки по 7-балльной шкале эмоций (1=Разочарование, 7=Интуитивно) и текстовые комментарии для каждого задания.

ТВОЯ ЗАДАЧА:
1. Проанализируй все отчёты
2. Составь резюме с приоритизацией задач на основе полученных данных

ФОРМАТ ОТВЕТА (строго по структуре):

## Обзор
[Краткое описание: сколько участников, общая картина]

## Проблемные зоны (по приоритету)
[Пронумерованный список проблем от самых критичных к менее значимым. Для каждой — ссылка на задание и комментарий участника]

## Сильные стороны
[Что пользователи оценили положительно]

## Рекомендации
[Конкретные предложения по улучшению в порядке приоритета]

## Приоритезация задач
[Нумерованный список конкретных задач для доработки прототипа с указанием приоритета: Критично / Важно / Желательно]

---
ОТЧЁТЫ УЧАСТНИКОВ:

${allReportsText}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Ты профессиональный UX-аналитик. Отвечай на русском языке. Будь конкретен и опирайся на данные.' },
        { role: 'user', content: analysisPrompt },
      ],
      thinking: { type: 'disabled' },
    });

    const analysis = completion.choices[0]?.message?.content || 'Анализ не удалось сформировать';

    return NextResponse.json({ analysis, reportsAnalyzed: reports.length });
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json({ error: 'Ошибка анализа: ' + (err instanceof Error ? err.message : 'неизвестная ошибка') }, { status: 500 });
  }
}
