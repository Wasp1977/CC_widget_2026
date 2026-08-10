import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import ZAI from 'z-ai-web-dev-sdk';

const RESULTS_DIR = path.join(process.cwd(), 'results');

// POST /api/analyze — LLM analysis of all reports
export async function POST() {
  try {
    const files = await readdir(RESULTS_DIR);
    const txtFiles = files.filter((f) => f.endsWith('.txt'));

    if (txtFiles.length === 0) {
      return NextResponse.json({ error: 'Нет сохранённых отчётов для анализа' }, { status: 400 });
    }

    // Read all report contents
    const allContents: string[] = [];
    for (const filename of txtFiles) {
      const content = await readFile(path.join(RESULTS_DIR, filename), 'utf-8');
      allContents.push(`--- ${filename} ---\n${content}`);
    }

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

    return NextResponse.json({ analysis, reportsAnalyzed: txtFiles.length });
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json({ error: 'Ошибка анализа: ' + (err instanceof Error ? err.message : 'неизвестная ошибка') }, { status: 500 });
  }
}
