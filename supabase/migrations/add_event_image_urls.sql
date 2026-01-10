-- Adicionar colunas de URL de imagem à tabela events
ALTER TABLE events
ADD COLUMN card_image_url text NULL,
ADD COLUMN exposure_card_image_url text NULL,
ADD COLUMN banner_image_url text NULL;

-- Opcional: Se desejar, você pode adicionar valores padrão ou NOT NULL aqui,
-- mas para começar, NULL é mais seguro para dados existentes.

