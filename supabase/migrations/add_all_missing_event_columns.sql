-- Migração abrangente para adicionar todas as colunas e chaves estrangeiras faltantes na tabela 'events'

-- Adicionar 'title' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS title text NULL;

-- Adicionar 'description' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS description text NULL;

-- Adicionar 'event_date' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date date NULL;

-- Adicionar 'event_time' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time text NULL; -- Armazenar como texto HH:MM

-- Adicionar 'location' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS location text NULL;

-- Adicionar 'address' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS address text NULL;

-- Adicionar 'card_image_url' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS card_image_url text NULL;

-- Adicionar 'exposure_card_image_url' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS exposure_card_image_url text NULL;

-- Adicionar 'banner_image_url' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_image_url text NULL;

-- Adicionar 'min_age' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_age integer NULL;

-- Adicionar 'category' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS category text NULL;

-- Adicionar 'capacity' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity integer NULL;

-- Adicionar 'duration' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS duration text NULL;

-- Adicionar 'is_paid' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT FALSE;

-- Adicionar 'ticket_price' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price numeric(10, 2) NULL;

-- Adicionar 'created_by' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by uuid NULL;

-- Adicionar 'company_id' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS company_id uuid NULL;

-- Adicionar 'status' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Adicionar 'contract_id' (se faltar)
ALTER TABLE events ADD COLUMN IF NOT EXISTS contract_id uuid NULL;

-- Adicionar chaves estrangeiras, se ainda não existirem
-- Adicionar FK para 'created_by' referenciando 'profiles'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_created_by' AND contrelid = 'events'::regclass) THEN
        ALTER TABLE events ADD CONSTRAINT fk_created_by
        FOREIGN KEY (created_by) REFERENCES profiles (id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Adicionar FK para 'company_id' referenciando 'companies'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_company' AND contrelid = 'events'::regclass) THEN
        ALTER TABLE events ADD CONSTRAINT fk_company
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Adicionar FK para 'contract_id' referenciando 'event_contracts'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_event_contract' AND contrelid = 'events'::regclass) THEN
        ALTER TABLE events ADD CONSTRAINT fk_event_contract
        FOREIGN KEY (contract_id) REFERENCES event_contracts (id) ON DELETE SET NULL;
    END IF;
END
$$;

