-- Adicionar coluna contract_id à tabela events
ALTER TABLE events
ADD COLUMN contract_id uuid NULL;

-- Opcional: Adicionar uma chave estrangeira se houver uma tabela de contratos
-- Exemplo: ALTER TABLE events ADD CONSTRAINT fk_contract FOREIGN KEY (contract_id) REFERENCES event_contracts(id);
