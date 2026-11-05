import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
let html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'assets/styles.css'),'utf8');
const favicon=readFileSync(join(root,'assets/favicon.svg')).toString('base64');
html=html.replace(/<link\b[^>]*>/gi,tag=>{
  const rel=tag.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2].toLowerCase().split(/\s+/) || [];
  if(rel.includes('manifest') || rel.some(value=>value.startsWith('apple-'))) return '';
  if(rel.includes('stylesheet') && /href=["']\.\/assets\/styles\.css["']/.test(tag)) return `<style>${css}</style>`;
  return tag.replace(/href=(["'])\.\/assets\/favicon\.svg\1/,`href="data:image/svg+xml;base64,${favicon}"`);
});
const scripts=['<script>window.COACH_STANDALONE = true;</script>'];
html=html.replace(/\s*<script\b[^>]*\bsrc=["']\.\/(assets\/[A-Za-z0-9_./-]+\.js)["'][^>]*>\s*<\/script>/gi,(_,path)=>{
  if(path.split('/').includes('..')) throw new Error('Standalone scripts must be local app assets.');
  scripts.push(`<script>\n${readFileSync(join(root,path),'utf8').replace(/<\/script/gi,'<\\/script')}\n</script>`);
  return '';
});
// App initialization runs after its document exists, even with no web server.
html=html.replace('</body>',()=>`${scripts.join('\n')}\n</body>`);
mkdirSync(join(root,'dist'),{recursive:true});
writeFileSync(join(root,'dist/English_Speaking_Coach.html'),html);
console.log('Built dist/English_Speaking_Coach.html: CSS, content, code and icon are self-contained.');
