import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../db.js';

const router = express.Router();

/* ── Gera token de sessão e insere no banco ───────────────────── */
async function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await pool.query(
    'INSERT INTO user_sessions (token, user_id, username, role, expires_at) VALUES (?, ?, ?, ?, ?)',
    [token, user.id, user.username, user.role, expiresAt]
  );
  return token;
}

/* ── POST /api/auth/login ─────────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: 'username, password e role são obrigatórios' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?) AND role = ? LIMIT 1',
      [username, role]
    );
    if (!rows.length) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

    const token = await createSession(user);
    res.json({ ok: true, token, username: user.username, role: user.role });
  } catch (err) {
    console.error('[POST /api/auth/login]', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

/* ── POST /api/auth/logout ────────────────────────────────────── */
router.post('/logout', async (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token) {
    try { await pool.query('DELETE FROM user_sessions WHERE token = ?', [token]); }
    catch { /* silencioso */ }
  }
  res.json({ ok: true });
});

/* ── Middleware: sessão válida de role master ──────────────────── */
async function requireMaster(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(403).json({ error: 'Acesso negado' });

  try {
    const [rows] = await pool.query(
      "SELECT * FROM user_sessions WHERE token = ? AND role = 'master' AND expires_at > NOW() LIMIT 1",
      [token]
    );
    if (!rows.length) return res.status(403).json({ error: 'Sessão inválida ou sem permissão' });
    req.masterUser = rows[0];
    next();
  } catch (err) {
    console.error('[requireMaster]', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
}

/* ── GET /api/auth/users ─── listar todos ─────────────────────── */
router.get('/users', requireMaster, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, role FROM admin_users ORDER BY role DESC, username ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/auth/users]', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

/* ── POST /api/auth/users ─── criar usuário ───────────────────── */
router.post('/users', requireMaster, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: 'username, password e role são obrigatórios' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, hash, role]
    );
    res.json({ ok: true, id: result.insertId, username, role });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Username já existe' });
    console.error('[POST /api/auth/users]', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

/* ── PUT /api/auth/users/:id ─── editar usuário ───────────────── */
router.put('/users/:id', requireMaster, async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  if (!username || !role)
    return res.status(400).json({ error: 'username e role são obrigatórios' });

  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE admin_users SET username = ?, password_hash = ?, role = ? WHERE id = ?',
        [username, hash, role, id]
      );
    } else {
      await pool.query(
        'UPDATE admin_users SET username = ?, role = ? WHERE id = ?',
        [username, role, id]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Username já existe' });
    console.error('[PUT /api/auth/users]', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

/* ── DELETE /api/auth/users/:id ─── excluir usuário ──────────── */
router.delete('/users/:id', requireMaster, async (req, res) => {
  const { id } = req.params;

  try {
    const [masters] = await pool.query("SELECT id FROM admin_users WHERE role = 'master'");
    const targetIsMaster = masters.some(m => String(m.id) === String(id));
    if (targetIsMaster && masters.length <= 1) {
      return res.status(400).json({ error: 'Não é possível excluir o único usuário master.' });
    }
    if (String(req.masterUser?.user_id) === String(id)) {
      return res.status(400).json({ error: 'Você não pode excluir a si mesmo.' });
    }
    // Invalida todas as sessões do usuário deletado
    await pool.query('DELETE FROM user_sessions WHERE user_id = ?', [id]);
    await pool.query('DELETE FROM admin_users WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/auth/users]', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
