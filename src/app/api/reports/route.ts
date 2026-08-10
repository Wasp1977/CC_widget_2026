import { NextRequest, NextResponse } from 'next/server';
import { readdir, writeFile, readFile, stat } from 'fs/promises';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'results');

interface ReportPayload {
  participantName: string;
  participantEmail: string;
  scenarioName: string;
  steps: { id: string; label: string; description: string }[];
  state: Record<string, { rating: { emoji: string; label: string; value: number } | null; comment: string }>;
  reportText: string;
  submittedAt: string;
}

// GET /api/reports — list all reports
export async function GET() {
  try {
    const files = await readdir(RESULTS_DIR);
    const txtFiles = files.filter((f) => f.endsWith('.txt'));

    const metas = await Promise.all(
      txtFiles.map(async (filename) => {
        const filePath = path.join(RESULTS_DIR, filename);
        const fileStat = await stat(filePath);
        const content = await readFile(filePath, 'utf-8');

        // Extract participant name from first few lines
        const nameMatch = content.match(/Участник:\s*(.+)/);
        const dateMatch = content.match(/Дата:\s*(.+)/);
        const name = nameMatch ? nameMatch[1].trim() : 'Аноним';
        const submittedAt = dateMatch ? dateMatch[1].trim() : fileStat.birthtime.toISOString();

        return {
          id: filename.replace('.txt', ''),
          filename,
          participantName: name,
          submittedAt,
          size: fileStat.size,
        };
      }),
    );

    // Sort by creation time descending (newest first)
    metas.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    return NextResponse.json(metas);
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/reports — save a new report
export async function POST(req: NextRequest) {
  try {
    const payload: ReportPayload = await req.json();

    if (!payload.reportText || !payload.steps?.length) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nameSlug = payload.participantName?.trim()
      ? `-${payload.participantName.trim().replace(/\s+/g, '_').toLowerCase()}`
      : '';
    const filename = `report-${timestamp}${nameSlug}.txt`;

    const filePath = path.join(RESULTS_DIR, filename);
    await writeFile(filePath, payload.reportText, 'utf-8');

    return NextResponse.json({ success: true, filename, id: filename.replace('.txt', '') });
  } catch (err) {
    console.error('Error saving report:', err);
    return NextResponse.json({ error: 'Ошибка сохранения отчёта' }, { status: 500 });
  }
}
