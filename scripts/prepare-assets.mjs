import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../../tmp/pdf_tools/node_modules/sharp/dist/index.mjs';

const sourceRoot = path.resolve('../tmp/review_caderno');
const renderedRoot = path.resolve('../tmp/review_output');
const publicRoot = path.resolve('public/project');

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
}

await fs.mkdir(path.join(publicRoot, 'images'), { recursive: true });
await fs.mkdir(path.join(publicRoot, 'plans'), { recursive: true });

const roomFiles = (await walk(path.join(sourceRoot, '01. IMAGENS'))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
const rooms = new Map();
let imageNo = 0;
for (const file of roomFiles) {
  try {
    const meta = await sharp(file).metadata();
    if (!meta.width) continue;
    imageNo++;
    const room = path.basename(path.dirname(file)).replace(/^\d+\s*/, '').trim();
    const filename = `${String(imageNo).padStart(3,'0')}.webp`;
    await sharp(file).rotate().resize(1800, 1350, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 76 }).toFile(path.join(publicRoot, 'images', filename));
    if (!rooms.has(room)) rooms.set(room, []);
    rooms.get(room).push({ src: `/project/images/${filename}`, alt: `${room} — vista ${rooms.get(room).length + 1}`, width: meta.width, height: meta.height });
  } catch {}
}

const planDefs = [
  ['pdf_01','Gesso e iluminação','Forros, sancas, perfis, luminárias e reforços'],
  ['pdf_02','Ar-condicionado','Posições arquitetônicas dos equipamentos'],
  ['pdf_03','Pontos elétricos','Tomadas, alimentação, LEDs e equipamentos'],
  ['pdf_04','Pontos hidrossanitários','Água, esgoto e pontos dos ambientes'],
  ['pdf_05','Marcenaria — pavimento superior','27 pranchas de detalhamento'],
  ['pdf_06','Marcenaria — térreo','38 pranchas de detalhamento'],
  ['pdf_07','Caderno técnico completo','86 páginas consolidadas'],
];
const plans = [];
for (const [folder,title,description] of planDefs) {
  const dir=path.join(renderedRoot,folder);
  const pages=(await fs.readdir(dir)).filter(n=>n.endsWith('.jpg')).sort();
  const pageList=[];
  for(let i=0;i<pages.length;i++){
    const filename=`${folder}-${String(i+1).padStart(3,'0')}.webp`;
    await sharp(path.join(dir,pages[i])).resize(1600,1200,{fit:'inside',withoutEnlargement:false}).webp({quality:72}).toFile(path.join(publicRoot,'plans',filename));
    pageList.push({src:`/project/plans/${filename}`,alt:`${title} — página ${i+1}`});
  }
  plans.push({title,description,pages:pageList});
}

const manifest={rooms:[...rooms].map(([name,images])=>({name,images})),plans};
await fs.writeFile(path.join(publicRoot,'manifest.json'),JSON.stringify(manifest), 'utf8');
console.log(JSON.stringify({rooms:manifest.rooms.length,images:imageNo,plans:plans.reduce((n,p)=>n+p.pages.length,0)}));
