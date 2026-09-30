const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const toDelete = ["cisa_kev", "greynoise", "shadowserver", "spamhaus"];
  
  console.log("Deleting...");
  for (const slug of toDelete) {
    const { data, error } = await supabase.from('sources').delete().eq('slug', slug);
    if (error) console.error(error);
    else console.log(`Deleted ${slug}`);
  }
}

main();
