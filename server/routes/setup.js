/**
 * setup.js — Rota HTTP para rodar manutenções que normalmente exigiriam
 * terminal SSH (indisponível neste plano de hospedagem). Protegida por
 * SETUP_TOKEN: sem essa variável definida, a rota fica DESATIVADA (404).
 *
 * Uso: defina SETUP_TOKEN nas variáveis de ambiente do site, reinicie o
 * app e acesse (no navegador, logado como admin do painel ou não — o
 * token é a autenticação):
 *   https://SEU-SITE/api/setup/full-setup?token=SEU_TOKEN_SECRETO
 *
 * IMPORTANTE: depois de usar, REMOVA a variável SETUP_TOKEN e reinicie o
 * app para desativar a rota — ela recria os usuários padrão com senhas
 * conhecidas, então não deve ficar exposta indefinidamente em produção.
 */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runFullSetup } from '../setup-full.js';
import pool from '../db.js';
import { sharedPool, sharedDbEnabled } from '../shared-db.js';
import { PORTAL } from '../shared-packages.js';
import { uploadsDir } from './upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Pasta public/uploads DENTRO da área de deploy (a que os deploys apagam) —
// diferente de uploadsDir (UPLOADS_DIR, persistente). Útil para checar se
// arquivos antigos ainda estão lá, mesmo sem o app servi-los mais dali.
const deployUploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');

const router = express.Router();

function requireSetupToken(req, res, next) {
  const configured = process.env.SETUP_TOKEN;
  if (!configured) return res.status(404).json({ error: 'Rota desativada (SETUP_TOKEN não configurado)' });
  if (req.query.token !== configured) return res.status(401).json({ error: 'Token inválido' });
  next();
}

router.get('/status', requireSetupToken, async (req, res) => {
  const lines = [];
  lines.push(`Portal: ${PORTAL}`);
  lines.push(`SHARED_DB_HOST: ${process.env.SHARED_DB_HOST || '(não definido, usa 127.0.0.1)'}`);
  lines.push(`SHARED_DB_PORT: ${process.env.SHARED_DB_PORT || '(não definido, usa 3306)'}`);
  lines.push(`SHARED_DB_NAME: ${process.env.SHARED_DB_NAME || '(NÃO DEFINIDO — integração desativada)'}`);
  lines.push(`SHARED_DB_USER: ${process.env.SHARED_DB_USER || '(não definido)'}`);
  lines.push(`Banco compartilhado ativo (sharedDbEnabled): ${sharedDbEnabled() ? 'SIM' : 'NÃO'}`);
  lines.push('');

  if (sharedDbEnabled()) {
    try {
      const [rows] = await sharedPool.query(
        'SELECT id, origem, esporte, JSON_UNQUOTE(JSON_EXTRACT(payload, "$.title")) AS titulo FROM shared_packages ORDER BY id'
      );
      lines.push('✅ Conexão com o banco compartilhado OK.');
      lines.push(`Total de pacotes na tabela shared_packages: ${rows.length}`);
      for (const r of rows) lines.push(`  #${r.id} [origem: ${r.origem} / esporte: ${r.esporte}] "${r.titulo}"`);
    } catch (err) {
      lines.push(`❌ ERRO ao conectar/consultar o banco compartilhado: ${err.code || ''} ${err.message}`);
    }
  } else {
    lines.push('⚠️ Integração desativada — defina SHARED_DB_NAME para ativar.');
  }

  lines.push('');
  try {
    const [rows] = await pool.query('SELECT packages FROM site_content WHERE id = 1');
    const packages = rows.length ? JSON.parse(rows[0].packages || '[]') : [];
    lines.push(`Pacotes no banco PRÓPRIO deste portal (site_content, legado/backup): ${packages.length}`);
    for (const p of packages) lines.push(`  - "${p.title}" (origem: ${p.origem || 'local, ainda não sincronizado'})`);
  } catch (err) {
    lines.push(`❌ ERRO ao consultar o banco próprio: ${err.message}`);
  }

  res.type('text/plain').send(lines.join('\n'));
});

/** Dump do payload bruto de um pacote da tabela compartilhada — para
 *  diagnosticar se um campo específico (sportType, videoUrl, heroType...)
 *  realmente foi gravado no banco, sem depender do que a UI mostra. */
router.get('/pkg-raw', requireSetupToken, async (req, res) => {
  if (!sharedDbEnabled()) return res.type('text/plain').send('Banco compartilhado desativado.');
  try {
    const id = req.query.id;
    const [rows] = id
      ? await sharedPool.query('SELECT * FROM shared_packages WHERE id = ?', [id])
      : await sharedPool.query('SELECT * FROM shared_packages ORDER BY id');
    const lines = [];
    for (const r of rows) {
      lines.push(`#${r.id} [origem: ${r.origem} / esporte: ${r.esporte}] sport_type_torcida: ${r.sport_type_torcida ?? '(null)'}`);
      lines.push(r.payload);
      lines.push('');
    }
    res.type('text/plain').send(lines.join('\n') || 'Nenhum pacote encontrado.');
  } catch (err) {
    res.status(500).type('text/plain').send(`Erro: ${err.message}`);
  }
});

/** Diagnostica um arquivo dentro de UPLOADS_DIR sem passar pela CDN/otimizador
 *  de imagens — lê o arquivo direto no disco pelo próprio app Node. */
router.get('/check-upload', requireSetupToken, (req, res) => {
  const lines = [];
  const isDeploy = req.query.area === 'deploy';
  const dir = isDeploy ? deployUploadsDir : uploadsDir;
  lines.push(`Área: ${isDeploy ? 'deploy (public/uploads — apagada a cada deploy)' : 'persistente (UPLOADS_DIR)'}`);
  lines.push(`UPLOADS_DIR configurado: ${process.env.UPLOADS_DIR || '(não definido — usando public/uploads local)'}`);
  lines.push(`Caminho resolvido: ${dir}`);
  lines.push(`Pasta existe: ${fs.existsSync(dir) ? 'SIM' : 'NÃO'}`);
  lines.push('');

  const file = req.query.file;
  if (!file) {
    try {
      const all = fs.readdirSync(dir);
      lines.push(`Total de arquivos na pasta: ${all.length}`);
      lines.push('Use ?file=NOME_DO_ARQUIVO para checar um específico (ou &area=deploy para ver a outra pasta). Primeiros 30:');
      for (const f of all.slice(0, 30)) {
        const stat = fs.statSync(path.join(dir, f));
        lines.push(`  ${f} — ${stat.size} bytes`);
      }
    } catch (err) {
      lines.push(`❌ ERRO ao listar a pasta: ${err.message}`);
    }
  } else {
    const safeName = path.basename(file); // evita path traversal
    const filePath = path.join(dir, safeName);
    try {
      const stat = fs.statSync(filePath);
      lines.push(`Arquivo: ${safeName}`);
      lines.push(`Tamanho: ${stat.size} bytes`);
      const buf = fs.readFileSync(filePath);
      const magic = buf.subarray(0, 8).toString('hex');
      lines.push(`Primeiros bytes (hex): ${magic}`);
      const isPng = magic.startsWith('89504e47');
      const isJpeg = magic.startsWith('ffd8ff');
      const isWebp = buf.subarray(8, 12).toString('ascii') === 'WEBP';
      lines.push(`Assinatura reconhecida: ${isPng ? 'PNG válido' : isJpeg ? 'JPEG válido' : isWebp ? 'WEBP válido' : 'NÃO reconhecida — arquivo pode estar corrompido'}`);
    } catch (err) {
      lines.push(`❌ ERRO ao ler "${safeName}": ${err.message}`);
    }
  }

  res.type('text/plain').send(lines.join('\n'));
});

/** Varre TODO o conteúdo salvo (site_content + shared_packages, se ativo)
 *  procurando referências a /uploads/... e confere, uma a uma, se o arquivo
 *  realmente existe na pasta persistente — sem depender da CDN. */
router.get('/check-all-images', requireSetupToken, async (req, res) => {
  const lines = [];
  const refs = new Set(); // valor -> onde apareceu (guardamos separado)
  const foundIn = new Map(); // path do arquivo -> lista de "onde"

  function scan(blob, label) {
    if (!blob) return;
    const text = typeof blob === 'string' ? blob : JSON.stringify(blob);
    const matches = text.match(/\/uploads\/[A-Za-z0-9._-]+/g) || [];
    for (const m of matches) {
      refs.add(m);
      if (!foundIn.has(m)) foundIn.set(m, new Set());
      foundIn.get(m).add(label);
    }
  }

  try {
    const [rows] = await pool.query('SELECT * FROM site_content WHERE id = 1');
    if (rows.length) {
      const row = rows[0];
      scan(row.events, 'events');
      scan(row.packages, 'packages (backup local)');
      scan(row.testimonials, 'testimonials');
      scan(row.hero_images, 'hero_images (Galeria Hero)');
      scan(row.category_icons, 'category_icons');
    }
  } catch (err) {
    lines.push(`❌ ERRO ao ler site_content: ${err.message}`);
  }

  if (sharedDbEnabled()) {
    try {
      const [rows] = await sharedPool.query('SELECT id, origem, payload FROM shared_packages');
      for (const r of rows) scan(r.payload, `shared_packages #${r.id} (origem: ${r.origem})`);
    } catch (err) {
      lines.push(`❌ ERRO ao ler shared_packages: ${err.message}`);
    }
  }

  const results = [...refs].sort().map(ref => {
    const filename = ref.replace('/uploads/', '');
    const filePath = path.join(uploadsDir, filename);
    const ok = fs.existsSync(filePath);
    return { ref, ok, where: [...foundIn.get(ref)].join(', ') };
  });

  const broken = results.filter(r => !r.ok);
  const ok = results.filter(r => r.ok);

  lines.push(`Total de referências /uploads/ encontradas: ${results.length}`);
  lines.push(`✅ OK: ${ok.length}   ❌ QUEBRADAS: ${broken.length}`);
  lines.push('');
  if (broken.length) {
    lines.push('❌ REFERÊNCIAS QUEBRADAS (arquivo não existe na pasta persistente):');
    for (const r of broken) lines.push(`  ${r.ref}  —  onde: ${r.where}`);
    lines.push('');
  }
  lines.push('✅ Referências OK:');
  for (const r of ok) lines.push(`  ${r.ref}  —  onde: ${r.where}`);

  res.type('text/plain').send(lines.join('\n'));
});

router.get('/full-setup', requireSetupToken, async (req, res) => {
  try {
    const log = await runFullSetup();
    res.type('text/plain').send(log.join('\n') + '\n\nLembre-se de remover SETUP_TOKEN e reiniciar o app depois de conferir.');
  } catch (err) {
    console.error('[GET /api/setup/full-setup]', err);
    res.status(500).json({ error: 'Erro ao rodar o setup', details: err.message });
  }
});

export default router;
