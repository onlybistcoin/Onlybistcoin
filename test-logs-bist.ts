import fs from 'fs';
const logPath = '/root/.pm2/logs/server-out.log';
if (fs.existsSync(logPath)) {
  const logs = fs.readFileSync(logPath, 'utf8');
  const lines = logs.split('\n');
  const relevant = lines.filter(l => l.includes('Updated') && l.includes('BIST'));
  console.log(relevant.slice(-20).join('\n'));
} else {
  console.log("Log file not found");
}
