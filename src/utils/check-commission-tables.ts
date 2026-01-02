import { supabase } from '@/integrations/supabase/client';

export interface TableStructure {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
}

/**
 * Verifica a estrutura das tabelas de comissão no Supabase
 */
export async function checkCommissionTablesStructure() {
    console.log('🔍 Verificando estrutura das tabelas de comissão...\n');

    // Verifica se a tabela commission_ranges existe e sua estrutura
    try {
        const { data: rangesData, error: rangesError } = await supabase
            .from('commission_ranges')
            .select('*')
            .limit(0);

        if (rangesError) {
            console.error('❌ Erro ao acessar commission_ranges:', rangesError.message);
            console.log('\n📋 Estrutura esperada para commission_ranges:');
            console.log(`
CREATE TABLE commission_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_tickets INT NOT NULL,
    max_tickets INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (min_tickets <= max_tickets),
    CHECK (percentage >= 0 AND percentage <= 100)
);
            `);
            return false;
        }

        console.log('✅ Tabela commission_ranges existe e está acessível');

        // Tenta inserir um registro de teste para verificar estrutura
        const testData = {
            min_tickets: 1,
            max_tickets: 100,
            percentage: 15.00,
            active: true
        };

        const { data: testInsert, error: insertError } = await supabase
            .from('commission_ranges')
            .insert([testData])
            .select()
            .single();

        if (insertError) {
            console.error('❌ Erro ao inserir teste em commission_ranges:', insertError.message);
            console.log('Detalhes:', insertError);
            return false;
        }

        console.log('✅ Estrutura de commission_ranges está correta');
        
        // Remove o registro de teste
        if (testInsert?.id) {
            await supabase
                .from('commission_ranges')
                .delete()
                .eq('id', testInsert.id);
        }

    } catch (error: any) {
        console.error('❌ Erro inesperado ao verificar commission_ranges:', error.message);
        return false;
    }

    // Verifica se a tabela commission_ranges_history existe
    try {
        const { data: historyData, error: historyError } = await supabase
            .from('commission_ranges_history')
            .select('*')
            .limit(0);

        if (historyError) {
            console.error('❌ Erro ao acessar commission_ranges_history:', historyError.message);
            console.log('\n📋 Estrutura esperada para commission_ranges_history:');
            console.log(`
CREATE TABLE commission_ranges_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_range_id UUID NOT NULL REFERENCES commission_ranges(id) ON DELETE CASCADE,
    min_tickets INT NOT NULL,
    max_tickets INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
            `);
            return false;
        }

        console.log('✅ Tabela commission_ranges_history existe e está acessível');

        // Verifica se consegue inserir um registro de teste
        const { data: existingRange } = await supabase
            .from('commission_ranges')
            .select('id')
            .limit(1)
            .single();

        if (existingRange) {
            const testHistoryData = {
                commission_range_id: existingRange.id,
                min_tickets: 1,
                max_tickets: 100,
                percentage: 15.00
            };

            const { data: testHistoryInsert, error: historyInsertError } = await supabase
                .from('commission_ranges_history')
                .insert([testHistoryData])
                .select()
                .single();

            if (historyInsertError) {
                console.error('❌ Erro ao inserir teste em commission_ranges_history:', historyInsertError.message);
                console.log('Detalhes:', historyInsertError);
                return false;
            }

            console.log('✅ Estrutura de commission_ranges_history está correta');
            
            // Remove o registro de teste
            if (testHistoryInsert?.id) {
                await supabase
                    .from('commission_ranges_history')
                    .delete()
                    .eq('id', testHistoryInsert.id);
            }
        } else {
            console.log('⚠️  Não há faixas existentes para testar commission_ranges_history');
        }

    } catch (error: any) {
        console.error('❌ Erro inesperado ao verificar commission_ranges_history:', error.message);
        return false;
    }

    console.log('\n✅ Todas as tabelas estão configuradas corretamente!');
    return true;
}

/**
 * Verifica se há dados nas tabelas
 */
export async function checkCommissionTablesData() {
    console.log('\n📊 Verificando dados nas tabelas...\n');

    const { data: ranges, error: rangesError } = await supabase
        .from('commission_ranges')
        .select('*')
        .order('min_tickets', { ascending: true });

    if (rangesError) {
        console.error('❌ Erro ao buscar faixas:', rangesError.message);
        return;
    }

    console.log(`📈 Faixas de comissão encontradas: ${ranges?.length || 0}`);
    if (ranges && ranges.length > 0) {
        ranges.forEach((range: any) => {
            const maxDisplay = range.max_tickets === 999999 ? 'ou mais' : range.max_tickets;
            console.log(`   - ${range.min_tickets} a ${maxDisplay} ingressos: ${range.percentage}% ${range.active ? '(Ativa)' : '(Inativa)'}`);
        });
    }

    const { data: history, error: historyError } = await supabase
        .from('commission_ranges_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(10);

    if (historyError) {
        console.error('❌ Erro ao buscar histórico:', historyError.message);
        return;
    }

    console.log(`\n📜 Registros no histórico: ${history?.length || 0} (últimos 10)`);
}

