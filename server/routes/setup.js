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
import { runFullSetup } from '../setup-full.js';

const router = express.Router();

function requireSetupToken(req, res, next) {
  const configured = process.env.SETUP_TOKEN;
  if (!configured) return res.status(404).json({ error: 'Rota desativada (SETUP_TOKEN não configurado)' });
  if (req.query.token !== configured) return res.status(401).json({ error: 'Token inválido' });
  next();
}

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
