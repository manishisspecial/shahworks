#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 HR Solutions App Setup\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('📝 Creating .env.local from env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExample);
    console.log('✅ .env.local created successfully!');
    console.log('\n⚠️  IMPORTANT: You need to update .env.local with your actual Supabase credentials:');
    console.log('   1. Go to https://supabase.com and create a new project');
    console.log('   2. Go to Settings > API in your Supabase dashboard');
    console.log('   3. Copy your project URL and anon key');
    console.log('   4. Update the values in .env.local');
    console.log('\n   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here');
  } else {
    console.log('❌ env.example not found!');
    process.exit(1);
  }
} else {
  console.log('✅ .env.local file exists');
  
  // Check if environment variables are set
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=') && 
                        !envContent.includes('NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && 
                        !envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here');
  
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    console.log('⚠️  Supabase credentials not configured properly!');
    console.log('   Please update .env.local with your actual Supabase credentials.');
  } else {
    console.log('✅ Supabase credentials are configured');
  }
}

console.log('\n📋 Next Steps:');
console.log('1. Update .env.local with your Supabase credentials');
console.log('2. Run the database schema in your Supabase SQL editor:');
console.log('   - Copy the content of database-schema.sql');
console.log('   - Paste it in your Supabase SQL editor and run it');
console.log('3. Install dependencies: npm install');
console.log('4. Start the development server: npm run dev');
console.log('5. Open http://localhost:3000 in your browser');

console.log('\n📚 For detailed setup instructions, see setup.md');
console.log('🆘 If you encounter issues, check the troubleshooting section in setup.md\n'); 