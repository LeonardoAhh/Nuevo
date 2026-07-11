-- Agregar columnas de preferencias de cuenta a profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'mm-dd-yyyy';

-- Crear tabla de preferencias de notificaciones
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_product_updates BOOLEAN DEFAULT false,
  email_comments BOOLEAN DEFAULT true,
  email_mentions BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  push_comments BOOLEAN DEFAULT true,
  push_mentions BOOLEAN DEFAULT true,
  push_direct_messages BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger updated_at para notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
