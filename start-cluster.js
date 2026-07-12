const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'auth', port: 3001, color: '\x1b[36m' },       // Cyan
  { name: 'booking-1', port: 3002, color: '\x1b[32m' },  // Green
  { name: 'booking-2', port: 3012, color: '\x1b[33m' },  // Yellow
  { name: 'booking-3', port: 3022, color: '\x1b[35m' },  // Magenta
  { name: 'info', port: 3003, color: '\x1b[34m' },       // Blue
  { name: 'payment', port: 3004, color: '\x1b[31m' },    // Red
  { name: 'event', port: 3005, color: '\x1b[35m' },      // Magenta
  { name: 'worker', port: 3006, color: '\x1b[90m' },     // Gray
  { name: 'ai', port: 3008, color: '\x1b[37m' },         // White
];

console.log('\x1b[1m\x1b[32m====================================================================');
console.log('🚀 KHỞI CHẠY CỤM SERVER TICKETBOX (LOAD BALANCING CLUSTER 3 INSTANCES)');
console.log('====================================================================\x1b[0m\n');

const isWin = /^win/.test(process.platform);
const cmd = isWin ? 'npx.cmd' : 'npx';

const processes = [];

services.forEach((srv) => {
  console.log(`${srv.color}▶ Đang khởi động máy chủ [${srv.name.toUpperCase()}] trên cổng [${srv.port}]...\x1b[0m`);
  
  const env = {
    ...process.env,
    PORT: srv.port.toString(),
    SERVICE_NAME: srv.name,
    FORCE_COLOR: '1',
  };

  const child = spawn(cmd, ['ts-node', 'src/main.ts'], {
    env,
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWin,
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${srv.color}[${srv.name}:${srv.port}]\x1b[0m ${line.trim()}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${srv.color}[${srv.name}:${srv.port} ERROR]\x1b[0m \x1b[31m${line.trim()}\x1b[0m`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`\x1b[31m[!] Server ${srv.name} (cổng ${srv.port}) đã dừng (Exit code: ${code})\x1b[0m`);
  });

  processes.push(child);
});

console.log('\n\x1b[1m\x1b[33m💡 Mẹo: Chạy lệnh `node test-lb.js` ở một Terminal khác để chứng minh Load Balancing chia tải cho cổng 3002, 3012, 3022!\x1b[0m\n');

process.on('SIGINT', () => {
  console.log('\n\x1b[31m🛑 Đang tắt toàn bộ cụm Server...\x1b[0m');
  processes.forEach((p) => p.kill('SIGINT'));
  process.exit(0);
});
