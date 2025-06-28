#!/usr/bin/env node

/**
 * PeoplePulse HR Setup Verification Script
 * This script helps verify that your HR application is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 PeoplePulse HR Setup Verification\n');

// Check 1: Environment Variables
console.log('1. Checking environment variables...');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('   ✅ .env.local file exists with Supabase configuration');
  } else {
    console.log('   ❌ .env.local file exists but missing Supabase configuration');
  }
} else {
  console.log('   ❌ .env.local file not found');
  console.log('   💡 Create .env.local with your Supabase credentials');
}

// Check 2: Package.json
console.log('\n2. Checking package.json...');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['@supabase/supabase-js', 'next', 'react'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length === 0) {
    console.log('   ✅ All required dependencies are present');
  } else {
    console.log(`   ❌ Missing dependencies: ${missingDeps.join(', ')}`);
  }
} else {
  console.log('   ❌ package.json not found');
}

// Check 3: Database Schema
console.log('\n3. Checking database schema...');
const schemaPath = path.join(process.cwd(), 'database-schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const hasCompaniesTable = schemaContent.includes('CREATE TABLE public.companies');
  const hasUserProfilesTable = schemaContent.includes('CREATE TABLE public.user_profiles');
  const hasRLS = schemaContent.includes('ROW LEVEL SECURITY');
  
  if (hasCompaniesTable && hasUserProfilesTable && hasRLS) {
    console.log('   ✅ Database schema file is complete');
  } else {
    console.log('   ❌ Database schema file is incomplete');
  }
} else {
  console.log('   ❌ database-schema.sql not found');
}

// Check 4: Key Files
console.log('\n4. Checking key application files...');
const keyFiles = [
  'src/lib/supabaseClient.ts',
  'src/hooks/useUser.ts',
  'src/components/ProtectedRoute.tsx',
  'src/app/onboarding/page.tsx'
];

let missingFiles = 0;
keyFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (missing)`);
    missingFiles++;
  }
});

// Check 5: Next.js Configuration
console.log('\n5. Checking Next.js configuration...');
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  console.log('   ✅ next.config.ts exists');
} else {
  console.log('   ❌ next.config.ts not found');
}

// Summary
console.log('\n📋 Setup Summary:');
console.log('==================');

if (fs.existsSync(envPath) && fs.existsSync(schemaPath) && missingFiles === 0) {
  console.log('✅ Your setup looks good!');
  console.log('\nNext steps:');
  console.log('1. Run the database schema in Supabase SQL editor');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Test the registration flow');
} else {
  console.log('❌ Some issues found. Please review the checks above.');
  console.log('\nTo fix:');
  console.log('1. Create .env.local with your Supabase credentials');
  console.log('2. Run the database schema in Supabase');
  console.log('3. Install dependencies: npm install');
}

console.log('\n📖 For detailed setup instructions, see setup.md');
console.log('📖 For troubleshooting, see README.md'); 