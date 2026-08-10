import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports/[id] — get report content
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await db.report.findUnique({ where: { id } });

    if (!report) {
      return NextResponse.json({ error: 'Отчёт не найден' }, { status: 404 });
    }

    return NextResponse.json({
      id: report.id,
      filename: `report-${report.id}.txt`,
      content: report.reportText,
      size: new Blob([report.reportText]).size,
    });
  } catch {
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 });
  }
}

// DELETE /api/reports/[id] — delete a report
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.report.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Отчёт не найден' }, { status: 404 });
  }
}
