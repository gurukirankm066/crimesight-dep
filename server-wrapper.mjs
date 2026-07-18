import { spawn } from 'child_process';
import { openSync } from 'fs';
const logFd = openSync('/home/z/my-project/dev.log', 'a');
const env = { ...process.env, PATH: process.env.PATH };
let child;
function start() {
  child = spawn('npx', ['next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    detached: false,
    stdio: ['ignore', logFd, logFd],
    env
  });
  child.on('exit', (code) => {
    console.error(`Server exited with code ${code}, restarting in 2s...`);
    setTimeout(start, 2000);
  });
}
start();
setInterval(() => {}, 60000);
