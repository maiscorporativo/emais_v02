-- setup-shared.sql — Banco COMPARTILHADO de pacotes (integração dos 3 portais)
--
-- Este arquivo é DOCUMENTAÇÃO/BACKUP: em operação normal a tabela é criada
-- automaticamente pelo servidor na inicialização (server/shared-db.js).
-- Use apenas se quiser criar/inspecionar manualmente via phpMyAdmin.
--
-- Portais: GP Experience (gpexperience.tur.br), E-Mais (emais.tur.br)
--          e Torcida Placar (torcidaplacar.tur.br) — mesma conta Hostinger.
--
-- Regras: conteúdo editável só no portal de origem; os demais controlam
-- apenas visível/Em Alta/ordem (e o torcida, o template de esporte).
-- GP exibe apenas esporte = 'automobilismo'.

CREATE TABLE IF NOT EXISTS shared_packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origem ENUM('gp','emais','torcida') NOT NULL,          -- portal que criou (único que edita o conteúdo)
  esporte VARCHAR(40) NOT NULL DEFAULT 'automobilismo',  -- automobilismo | futebol | tenis | basquete | lutas | geral
  payload LONGTEXT NOT NULL,                             -- JSON completo do pacote (card + toda a LP + integrações)
  visivel_gp TINYINT(1) NOT NULL DEFAULT 1,              -- liga/desliga individual por portal
  visivel_emais TINYINT(1) NOT NULL DEFAULT 1,
  visivel_torcida TINYINT(1) NOT NULL DEFAULT 1,
  em_alta_gp TINYINT(1) NOT NULL DEFAULT 0,              -- "Em Alta" independente por portal
  em_alta_emais TINYINT(1) NOT NULL DEFAULT 0,
  em_alta_torcida TINYINT(1) NOT NULL DEFAULT 0,
  ordem_gp INT NOT NULL DEFAULT 0,                       -- ordem de exibição independente por portal
  ordem_emais INT NOT NULL DEFAULT 0,
  ordem_torcida INT NOT NULL DEFAULT 0,
  sport_type_torcida VARCHAR(40) NULL,                   -- override do template de esporte no torcida (NULL = usa o do payload)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_esporte (esporte),
  INDEX idx_origem (origem)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
