-- Adicionar coluna created_by à tabela events
ALTER TABLE events
ADD COLUMN created_by uuid NULL;

-- Opcional: Adicionar uma chave estrangeira para a tabela de perfis (profiles)
-- Isso garante que o created_by seja um ID de usuário válido.
ALTER TABLE events
ADD CONSTRAINT fk_created_by
FOREIGN KEY (created_by)
REFERENCES profiles (id)
ON DELETE SET NULL;

