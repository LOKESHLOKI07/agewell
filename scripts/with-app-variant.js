const { spawn } = require('child_process');

const variant = process.argv[2];
const command = process.argv.slice(3);

if (variant !== 'family' && variant !== 'care') {
  console.error('Usage: node scripts/with-app-variant.js <family|care> <command>...');
  process.exit(1);
}

if (command.length === 0) {
  console.error('Missing command');
  process.exit(1);
}

const env = {
  ...process.env,
  APP_VARIANT: variant,
  EXPO_PUBLIC_APP_VARIANT: variant,
};

const child = spawn(command[0], command.slice(1), { stdio: 'inherit', shell: true, env });
child.on('exit', (code) => process.exit(code ?? 0));
