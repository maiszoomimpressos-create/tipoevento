-- ============================================
-- Correção: Permitir leitura de contratos para todos os usuários autenticados
-- ============================================

-- Remove a política antiga que só permitia Admin Master ler
DROP POLICY IF EXISTS "Admin Master can manage event_contracts" ON event_contracts;

-- Nova política: Todos os usuários autenticados podem LER contratos
CREATE POLICY "Authenticated users can read event_contracts"
    ON event_contracts FOR SELECT
    USING (
        auth.uid() IS NOT NULL -- Qualquer usuário autenticado pode ler
    );

-- Política: Apenas Admin Master pode inserir contratos
CREATE POLICY "Admin Master can insert event_contracts"
    ON event_contracts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    );

-- Política: Apenas Admin Master pode atualizar contratos
CREATE POLICY "Admin Master can update event_contracts"
    ON event_contracts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    );

-- Política: Apenas Admin Master pode deletar contratos
CREATE POLICY "Admin Master can delete event_contracts"
    ON event_contracts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.tipo_usuario_id = 1
        )
    );

