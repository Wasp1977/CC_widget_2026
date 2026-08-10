import { createClient } from '@libsql/client';

const url = 'libsql://database-champagne-blanket-vercel-icfg-bypfdx9w0fydpofnsmltckbb.aws-us-east-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODYzNTYzMTgsImlkIjoiMDE5ZmViMjItNDEwMS03ZWU2LWE5Y2UtZDg2YzRhYzEyYjFjIiwia2lkIjoiRkU2SElfYU5ZNW9ZS2pqd2d3aGZaMTdKTFlmWUpqMENWcXdsUGFUTWhyTSIsInJpZCI6IjM0NzQ4ODA2LTE5NjMtNDFjMS05NzZmLWFjMjlmMzMxMzYyMiJ9.ChcvwGTS-MAlbvgJW2LxzPCXpZhm-Rei0vpbT5_n538Evvzo0fItx8RTYkwprBt3PSeiAM2O7HPjN_xKWoKEAw';

async function migrate() {
  const client = createClient({ url, authToken });

  console.log('Creating tables in Turso...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✅ User table');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Post (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      published BOOLEAN NOT NULL DEFAULT 0,
      authorId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✅ Post table');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Report (
      id TEXT PRIMARY KEY NOT NULL,
      participantName TEXT NOT NULL DEFAULT 'Аноним',
      participantEmail TEXT NOT NULL DEFAULT '',
      scenarioName TEXT NOT NULL DEFAULT '',
      reportText TEXT NOT NULL,
      stepsJson TEXT NOT NULL DEFAULT '[]',
      stateJson TEXT NOT NULL DEFAULT '{}',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✅ Report table');

  // Verify
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('\nTables in Turso:', tables.rows.map(r => r.name));

  await client.close();
  console.log('\n✅ Migration complete!');
}

migrate().catch(console.error);
