import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat, unlink } from 'fs/promises';
import path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'results');

// GET /api/reports/[id] — get report content
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filename = id.endsWith('.txt') ? id : `${id}.txt`;
    const filePath = path.join(RESULTS_DIR, filename);

    const fileContent = await readFile(filePath, 'utf-8');
    const fileStat = await stat(filePath);

    return NextResponse.json({
      id,
      filename,
      content: fileContent,
      size: fileStat.size,
    });
  } catch {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }
}

// DELETE /api/reports/[id] — delete a report
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filename = id.endsWith('.txt') ? id : `${id}.txt`;
    const filePath = path.join(RESULTS_DIR, filename);

    await unlink(filePath);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }
}
