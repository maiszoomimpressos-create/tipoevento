-- ============================================
-- Tabela de Faixas de Comissão
-- ============================================

-- Cria a tabela commission_ranges se não existir
CREATE TABLE IF NOT EXISTS commission_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_tickets INT NOT NULL,
    max_tickets INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_min_max CHECK (min_tickets <= max_tickets),
    CONSTRAINT check_percentage_range CHECK (percentage >= 0 AND percentage <= 100)
);

-- Cria índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_commission_ranges_min_tickets ON commission_ranges(min_tickets);
CREATE INDEX IF NOT EXISTS idx_commission_ranges_active ON commission_ranges(active);

-- ============================================
-- Tabela de Histórico de Faixas de Comissão
-- ============================================

-- Cria a tabela commission_ranges_history se não existir
CREATE TABLE IF NOT EXISTS commission_ranges_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_range_id UUID NOT NULL REFERENCES commission_ranges(id) ON DELETE CASCADE,
    min_tickets INT NOT NULL,
    max_tickets INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_commission_ranges_history_range_id ON commission_ranges_history(commission_range_id);
CREATE INDEX IF NOT EXISTS idx_commission_ranges_history_changed_at ON commission_ranges_history(changed_at DESC);

-- ============================================
-- Função para atualizar updated_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_commission_ranges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_commission_ranges_updated_at ON commission_ranges;
CREATE TRIGGER trigger_update_commission_ranges_updated_at
    BEFORE UPDATE ON commission_ranges
    FOR EACH ROW
    EXECUTE FUNCTION update_commission_ranges_updated_at();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Habilita RLS
ALTER TABLE commission_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_ranges_history ENABLE ROW LEVEL SECURITY;

-- Policy para commission_ranges: Apenas Admin Master (tipo_usuario_id = 1) pode ler/escrever
CREATE POLICY "Admin Master can read commission_ranges"
    ON commission_ranges FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    );

CREATE POLICY "Admin Master can insert commission_ranges"
    ON commission_ranges FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    );

CREATE POLICY "Admin Master can update commission_ranges"
    ON commission_ranges FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    );

CREATE POLICY "Admin Master can delete commission_ranges"
    ON commission_ranges FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    );

-- Policy para commission_ranges_history: Apenas Admin Master pode ler
CREATE POLICY "Admin Master can read commission_ranges_history"
    ON commission_ranges_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    );

CREATE POLICY "Admin Master can insert commission_ranges_history"
    ON commission_ranges_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    );

-- ============================================
-- Dados iniciais (exemplo)
-- ============================================

-- Insere faixas iniciais se a tabela estiver vazia
INSERT INTO commission_ranges (min_tickets, max_tickets, percentage, active)
SELECT 1, 100, 15.00, true
WHERE NOT EXISTS (SELECT 1 FROM commission_ranges WHERE min_tickets = 1 AND max_tickets = 100);

INSERT INTO commission_ranges (min_tickets, max_tickets, percentage, active)
SELECT 101, 500, 12.00, true
WHERE NOT EXISTS (SELECT 1 FROM commission_ranges WHERE min_tickets = 101 AND max_tickets = 500);

INSERT INTO commission_ranges (min_tickets, max_tickets, percentage, active)
SELECT 501, 1000, 10.00, true
WHERE NOT EXISTS (SELECT 1 FROM commission_ranges WHERE min_tickets = 501 AND max_tickets = 1000);

INSERT INTO commission_ranges (min_tickets, max_tickets, percentage, active)
SELECT 1001, 999999, 8.00, true
WHERE NOT EXISTS (SELECT 1 FROM commission_ranges WHERE min_tickets = 1001 AND max_tickets = 999999);

