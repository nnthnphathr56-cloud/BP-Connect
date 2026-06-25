const fs = require('fs');
const html = fs.readFileSync('d:/bpconnect/index.html', 'utf8');
let stack = [];
const regex = /<div[^>]*>|<\/div>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  const line = html.substring(0, match.index).split('\n').length;
  if (match[0].toLowerCase() === '</div>') {
    stack.pop();
  } else {
    const idMatch = match[0].match(/id=["']([^"']+)["']/);
    const id = idMatch ? idMatch[1] : '';
    stack.push({ line, tag: match[0], id });
  }
}
console.log('Unclosed divs:', stack);
