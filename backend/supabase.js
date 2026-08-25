const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' }); // Bizning .env fayl loyiha ildizida joylashgan

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("DIQQAT: Supabase URL yoki Key topilmadi. .env faylni tekshiring!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
