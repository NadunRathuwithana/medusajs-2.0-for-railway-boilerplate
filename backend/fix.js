const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'backend/src/modules/email-notifications/templates');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf-8');
  // Replace literal backslash followed by backtick with just backtick
  c = c.replace(/\\`/g, '`');
  // Replace literal backslash followed by dollar with just dollar
  c = c.replace(/\\\$/g, '$');
  fs.writeFileSync(p, c);
  console.log('Fixed', file);
});
