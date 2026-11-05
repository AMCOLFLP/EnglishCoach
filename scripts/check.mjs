import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const js = [...readdirSync(join(root,'assets')).filter(n=>n.endsWith('.js')).map(n=>`assets/${n}`), 'server/worker.mjs'];
for (const file of js) {
  const result = spawnSync(process.execPath,['--check',join(root,file)],{encoding:'utf8'});
  if(result.status !== 0) throw new Error(`${file}: ${result.stderr}`);
}
const context={window:{}};
vm.runInNewContext(readFileSync(join(root,'assets/content.js'),'utf8'),context);
const c=context.window.CoachContent;
assert.equal(c.lessons.length,13); assert.equal(c.scenarios.length,7);
assert.equal(c.pronunciation.length,14); assert.equal(c.quiz.length,35);
for (const [name,items] of Object.entries(c)) {
  assert.equal(new Set(items.map(x=>x.id)).size,items.length,`${name}: duplicate IDs`);
  for(const item of items) assert.match(item.id,/^[a-zA-Z0-9_-]+$/);
}
for(const lesson of c.lessons) {
  assert.ok(lesson.title && lesson.prompt && lesson.modelAnswer && lesson.starter);
  assert.ok(lesson.vocabulary.length>=4 && lesson.tasks.length>=3 && lesson.dialogue.length>=4);
  assert.ok(['A1','A2','B1'].includes(lesson.level));
}
for(const s of c.scenarios) {
  assert.equal(s.turns.length,4);
  for(const t of s.turns) assert.ok(t.question && t.hint && t.example);
}
for(const q of c.quiz) {
  assert.equal(q.options.length,4); assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
  assert.ok(q.explanation && q.question);
}
const html=readFileSync(join(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) assert.ok(existsSync(join(root,match[1])),`Missing asset: ${match[1]}`);
for(const filename of ['index.html',...js.filter(x=>x.startsWith('assets/'))]) {
  const text=readFileSync(join(root,filename),'utf8');
  assert.ok(!/speak-wise-ai-83\.lovable\.app|monica-content-root|data-context-token|50k\+|98% Improve/.test(text),`Captured-site artifact in ${filename}`);
}
console.log(`Source valid: ${js.length} scripts, all local assets, 13 lessons, 7 role plays, 14 phrase exercises, 35 quiz items.`);
