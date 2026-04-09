const fs = require('fs');
const path = require('path');

const stage1Content = fs.readFileSync(path.join(__dirname, 'src/stages/stage1.tsx'), 'utf8');

for (let i = 2; i <= 20; i++) {
  const stageId = i.toString().padStart(1, '');
  const stageIdPad = i.toString().padStart(2, '0');
  let content = stage1Content.replace(/stage1/g, `stage${stageId}`);
  content = content.replace(/Stage 01/g, `Stage ${stageIdPad}`);
  content = content.replace(/id: 1/g, `id: ${i}`);
  fs.writeFileSync(path.join(__dirname, `src/stages/stage${stageId}.tsx`), content);
}
