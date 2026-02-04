import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error && result.error.code !== 'ENOENT') {
  console.error('❌ Error loading .env file:', result.error);
} else {
  console.log('✅ Loaded .env from:', envPath);
  console.log('📋 Environment variables:');
  console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗');
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.log('  PORT:', process.env.PORT);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
}

// Now import and start the app
import('./server.js').catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
