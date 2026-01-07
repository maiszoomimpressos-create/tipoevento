-- Adiciona o campo contract_id na tabela events
ALTER TABLE events
ADD COLUMN contract_id UUID REFERENCES event_contracts(id) ON DELETE SET NULL;

-- Opcional: Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_events_contract_id ON events(contract_id);

