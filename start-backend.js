const { spawn } = require('child_process');

const services = [
  'start:auth',
  'start:info',
  'start:payment',
  'start:booking',
  'start:worker'
];

services.forEach((svc, index) => {
  // Stagger startup slightly to avoid ts-node cache collision
  setTimeout(() => {
    console.log(`Starting ${svc}...`);
    const p = spawn('npm.cmd', ['run', svc], { stdio: 'inherit' });
    p.on('exit', (code) => {
      console.log(`${svc} exited with code ${code}`);
    });
  }, index * 2000);
});
