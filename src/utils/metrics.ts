import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks the use of the advanced filter feature by incrementing a counter 
 * in the user_metrics table. Handles initial insertion if the row doesn't exist.
 * Note: This uses a fetch-then-upsert pattern which is acceptable for non-critical analytics.
 */
export const trackAdvancedFilterUse = async (userId: string) => {
    if (!userId) return;

    try {
        // 1. Try to fetch the current count
        const { data: currentData, error: fetchError } = await supabase
            .from('user_metrics')
            .select('qtd_filtros_avancados')
            .eq('user_id', userId)
            .single();

        // If no row found (PGRST116), currentData is null, and we proceed with count 1.
        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        const newCount = (currentData?.qtd_filtros_avancados || 0) + 1;
        
        const payload = {
            user_id: userId,
            qtd_filtros_avancados: newCount,
            last_filter_use: new Date().toISOString()
        };

        // 2. Perform UPSERT (Insert if not exists, Update if exists)
        const { error: upsertError } = await supabase
            .from('user_metrics')
            .upsert(payload, { onConflict: 'user_id' });

        if (upsertError) {
            throw upsertError;
        }

    } catch (error) {
        console.error("Failed to track advanced filter use:", error);
    }
};