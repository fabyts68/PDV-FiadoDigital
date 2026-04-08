const { existsSync, mkdirSync } = require('fs');
const { spawnSync } = require('child_process');
const { join } = require('path');

const root = process.cwd();
const dataDir = join(root, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir);
}

const env = {
  ...process.env,
  DATABASE_URL: 'file:./data/data.db',
  JWT_SECRET: 'b585b01a231f80d9ce4c2ab7e4aa83da0bfa77358b9e0335f659d34d18947e5818dda802454990f646a593c628ac1db26e90df9b855417ef38802fed0b95347a',
  JWT_REFRESH_SECRET: 'd2ac064980970dc47a2c53596f40ec455d16a150a4158eb820a56a8e6a1d4dbfe8767126b878cc1d27ee7fb29cdbf430fdc8cab65f53757a8313d263d56d6254',
};

console.log('DB URL:', env.DATABASE_URL);
const migrate = spawnSync('pnpm', ['--filter', '@pdv/api', 'run', 'db:migrate'], { stdio: 'inherit', env });
if (migrate.status !== 0) process.exit(migrate.status);
const seed = spawnSync('pnpm', ['--filter', '@pdv/api', 'run', 'db:seed'], { stdio: 'inherit', env });
process.exit(seed.status);
