import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports — list all reports
export async function GET() {
  try {
    const reports = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const metas = reports.map((r) => ({
      id: r.id,
      filename: `report-${r.id}.txt`,
      participantName: r.participantName || 'Аноним',
      submittedAt: r.createdAt.toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      size: new Blob([r.reportText]).size,
    }));

    return NextResponse.json(metas);
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/reports — save a new report
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload.reportText || !payload.steps?.length) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const report = await db.report.create({
      data: {
        participantName: payload.participantName?.trim() || 'Аноним',
        participantEmail: payload.participantEmail?.trim() || '',
        scenarioName: payload.scenarioName || '',
        reportText: payload.reportText,
        stepsJson: JSON.stringify(payload.steps),
        stateJson: JSON.stringify(payload.state),
      },
    });

    return NextResponse.json({
      success: true,
      id: report.id,
      filename: `report-${report.id}.txt`,
    });
  } catch (err) {
    console.error('Error saving report:', err);
    return NextResponse.json({ error: 'Ошибка сохранения отчёта' }, { status: 500 });
  }
}
