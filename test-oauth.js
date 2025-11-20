/**
 * OAuth Configuration Test Script
 * Run this to verify your OAuth setup
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

console.log("\n🔍 Testing OAuth Configuration...\n");

// Test 1: Environment Variables
console.log("1️⃣ Checking Environment Variables:");
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "APP_URL",
  "DATABASE_URL",
];

let envVarsOk = true;
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.substring(0, 30)}...`);
  } else {
    console.log(`   ❌ ${varName}: NOT SET`);
    envVarsOk = false;
  }
});

if (!envVarsOk) {
  console.log("\n❌ Some environment variables are missing!");
  console.log("Please check your .env file and restart the server.\n");
  process.exit(1);
}

// Test 2: Supabase Client Initialization
console.log("\n2️⃣ Testing Supabase Client:");
try {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  console.log("   ✅ Supabase client created successfully");

  // Test 3: OAuth Providers
  console.log("\n3️⃣ Testing OAuth Providers:");
  const providers = ["google", "discord", "github"];

  providers.forEach(async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${process.env.APP_URL}/auth/callback`,
          skipBrowserRedirect: true, // Don't actually redirect
        },
      });

      if (error) {
        console.log(`   ❌ ${provider}: ${error.message}`);
      } else if (data && data.url) {
        console.log(`   ✅ ${provider}: OAuth URL generated`);
        console.log(`      URL: ${data.url.substring(0, 50)}...`);
      } else {
        console.log(
          `   ⚠️  ${provider}: No URL returned (might not be configured)`
        );
      }
    } catch (err) {
      console.log(`   ❌ ${provider}: ${err.message}`);
    }
  });

  // Wait a bit for async operations
  setTimeout(() => {
    console.log("\n4️⃣ Configuration Summary:");
    console.log("   📝 Project Ref: hmblcvosifgmdarffuea");
    console.log("   📝 Site URL: " + process.env.APP_URL);
    console.log(
      "   📝 Callback URL: " + process.env.APP_URL + "/auth/callback"
    );
    console.log("\n5️⃣ Required Redirect URI for Providers:");
    console.log(
      "   🔗 https://hmblcvosifgmdarffuea.supabase.co/auth/v1/callback"
    );
    console.log("\n6️⃣ Next Steps:");
    console.log("   1. Verify providers are enabled in Supabase Dashboard");
    console.log("   2. Verify Client ID and Client Secret are filled");
    console.log("   3. Verify redirect URI in provider settings");
    console.log("   4. Test OAuth login in browser");
    console.log("\n✅ Test completed!\n");
  }, 2000);
} catch (error) {
  console.log("   ❌ Failed to create Supabase client:", error.message);
  console.log("\nPlease check:");
  console.log("1. SUPABASE_URL is correct");
  console.log("2. SUPABASE_ANON_KEY is correct");
  console.log("3. Package @supabase/supabase-js is installed\n");
  process.exit(1);
}
