import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const tursoUrl = 'libsql://database-champagne-blanket-vercel-icfg-bypfdx9w0fydpofnsmltckbb.aws-us-east-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODYzNTYzMTgsImlkIjoiMDE5ZmViMjItNDEwMS03ZWU2LWE5Y2UtZDg2YzRhYzEyYjFjIiwia2lkIjoiRkU2SElfYU5ZNW9ZS2pqd2d3aGZaMTdKTFlmWUpqMENWcXdsUGFUTWhyTSIsInJpZCI6IjM0NzQ4ODA2LTE5NjMtNDFjMS05NzZmLWFjMjlmMzMxMzYyMiJ9.ChcvwGTS-MAlbvgJW2LxzPCXpZhm-Rei0vpbT5_n538Evvzo0fItx8RTYkwprBt3PSeiAM2O7HPjN_xKWoKEAw';

async function test() {
  const adapter = new PrismaLibSQL({ url: tursoUrl, authToken });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    console.log('✅ Connected to Turso via Prisma adapter');

    // Write test
    const created = await prisma.report.create({
      data: {
        participantName: 'Turso Test',
        participantEmail: 'test@turso.dev',
        scenarioName: 'Migration Test',
        reportText: 'This is a test report from Turso migration.',
        stepsJson: '[{"step":1}]',
        stateJson: '{"test":true}',
      }
    });
    console.log('✅ Created report:', created.id.slice(0, 8));

    // Read test
    const count = await prisma.report.count();
    console.log('✅ Total reports:', count);

    const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' }, take: 3 });
    console.log('📋 Latest reports:');
    reports.forEach(r => console.log('  -', r.id.slice(0, 8), '|', r.participantName, '|', r.scenarioName));

    // Cleanup test
    await prisma.report.delete({ where: { id: created.id } });
    console.log('✅ Deleted test record');

    const finalCount = await prisma.report.count();
    console.log('✅ Final report count:', finalCount);

  } catch (e: any) {
    console.log('❌ ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();