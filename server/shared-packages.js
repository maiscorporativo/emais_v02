/**
 * shared-packages.js — Leitura/escrita dos pacotes na tabela COMPARTILHADA.
 *
 * Tradução entre o formato TrendingPackage que o front-end já usa e as
 * linhas de shared_packages (payload JSON + colunas de controle por portal).
 *
 * Campos "virtuais" adicionados a cada pacote na leitura:
 *   sharedId     → id da linha na tabela compartilhada
 *   origem       → 'gp' | 'emais' | 'torcida' (portal dono do conteúdo)
 *   portalHidden → true quando o pacote está DESLIGADO neste portal
 *   isTrending   → "Em Alta" DESTE portal (em_alta_<portal>)
 *
 * Regras de escrita:
 *   - origem própria  → grava payload completo + esporte + controles locais
 *   - outra origem    → grava APENAS controles locais (visível/Em Alta/ordem
 *                       e, no torcida, o override do template de esporte)
 *   - linha própria ausente do array recebido → exclusão definitiva (lixeira
 *     esvaziada no admin); a lixeira comum vive em payload.deletedAt (global)
 */
import { sharedPool, sharedDbEnabled } from './shared-db.js';

/** Identidade deste portal na integração. */
export const PORTAL = 'emais';

const VIS = `visivel_${PORTAL}`;
const ALTA = `em_alta_${PORTAL}`;
const ORDEM = `ordem_${PORTAL}`;

export { sharedDbEnabled };

/** Domínio público de cada portal — cada um guarda seus uploads no PRÓPRIO
 *  servidor, então um pacote de outra origem precisa referenciar a imagem
 *  pela URL absoluta do domínio dono, e não por um caminho relativo
 *  /uploads/... (que resolveria contra o domínio ERRADO ao ser exibido). */
const PORTAL_DOMAINS = {
  gp: 'https://gpexperience.tur.br',
  emais: 'https://emais.tur.br',
  torcida: 'https://torcidaplacar.tur.br',
};

/** Reescreve /uploads/... para a URL absoluta do domínio de origem, operando
 *  no texto bruto do payload (antes do JSON.parse) para alcançar também
 *  campos aninhados/serializados (galleryImages, cardsData, etc).
 *
 *  Só reescreve caminhos PRÓPRIOS — "/uploads/" logo após uma aspas (início
 *  de string ou de elemento de array JSON) ou logo após um espaço (o
 *  separador "; " usado por galleryImages/experienciaImages, que guardam
 *  várias URLs numa única string, não num array — cada item depois do
 *  primeiro vem após um espaço, não uma aspas). URLs externas com
 *  "/uploads/" no meio do caminho (ex: WordPress usa .../wp-content/
 *  uploads/... universalmente) sempre têm uma letra antes, nunca aspas
 *  ou espaço — ficam intactas. */
function absolutizeUploads(payloadText, origem) {
  const domain = PORTAL_DOMAINS[origem];
  if (!domain || origem === PORTAL) return payloadText;
  return payloadText.replace(/(["\s])\/uploads\//g, (_, prefix) => `${prefix}${domain}/uploads/`);
}

/** Pacotes visíveis para este portal (GP filtra automobilismo), na ordem local. */
export async function listSharedPackages() {
  const where = PORTAL === 'gp' ? "WHERE esporte = 'automobilismo'" : '';
  const [rows] = await sharedPool.query(
    `SELECT * FROM shared_packages ${where} ORDER BY ${ORDEM} ASC, id ASC`
  );
  const packages = [];
  for (const r of rows) {
    let pkg;
    try { pkg = JSON.parse(absolutizeUploads(r.payload, r.origem)) || {}; } catch { continue; }
    pkg.sharedId = r.id;
    pkg.origem = r.origem;
    pkg.portalHidden = !r[VIS];
    pkg.isTrending = !!r[ALTA];
    if (PORTAL === 'torcida' && r.sport_type_torcida) pkg.sportType = r.sport_type_torcida;
    packages.push(pkg);
  }
  return packages;
}

/** Sincroniza o array completo vindo do front com a tabela compartilhada. */
export async function saveSharedPackages(packages) {
  const [rows] = await sharedPool.query('SELECT id, origem FROM shared_packages');
  const byId = new Map(rows.map(r => [r.id, r]));
  const seen = new Set();

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i] || {};
    // Campos virtuais e por-portal ficam fora do payload
    const { sharedId, origem, portalHidden, isTrending, ...payload } = pkg;
    const alta = isTrending === true ? 1 : 0;
    const vis = portalHidden ? 0 : 1;
    const esporte = PORTAL === 'gp' ? 'automobilismo' : (pkg.sportType || 'automobilismo');

    if (!sharedId) {
      // Pacote novo criado neste portal
      const [res] = await sharedPool.query(
        `INSERT INTO shared_packages
           (origem, esporte, payload, ${ALTA}, ${VIS}, ordem_gp, ordem_emais, ordem_torcida)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [PORTAL, esporte, JSON.stringify(payload), alta, vis, i, i, i]
      );
      seen.add(res.insertId);
      continue;
    }

    seen.add(sharedId);
    const row = byId.get(sharedId);
    if (!row) continue; // linha sumiu (excluída por outro admin) — ignora

    if (row.origem === PORTAL) {
      await sharedPool.query(
        `UPDATE shared_packages
           SET payload = ?, esporte = ?, ${ALTA} = ?, ${VIS} = ?, ${ORDEM} = ?
         WHERE id = ?`,
        [JSON.stringify(payload), esporte, alta, vis, i, sharedId]
      );
    } else {
      // Outra origem: apenas controles locais deste portal
      const sets = [`${ALTA} = ?`, `${VIS} = ?`, `${ORDEM} = ?`];
      const vals = [alta, vis, i];
      if (PORTAL === 'torcida') {
        sets.push('sport_type_torcida = ?');
        vals.push(pkg.sportType || null);
      }
      vals.push(sharedId);
      await sharedPool.query(`UPDATE shared_packages SET ${sets.join(', ')} WHERE id = ?`, vals);
    }
  }

  // Linhas de origem própria que o front não enviou mais = exclusão definitiva
  for (const r of rows) {
    if (r.origem === PORTAL && !seen.has(r.id)) {
      await sharedPool.query('DELETE FROM shared_packages WHERE id = ?', [r.id]);
    }
  }
}
