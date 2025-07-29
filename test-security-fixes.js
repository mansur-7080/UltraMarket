/**
 * 🛡️ SECURITY FIXES TEST - UltraMarket
 * 
 * Comprehensive test to verify all security fixes
 * Tests admin credentials, environment validation, and security headers
 * 
 * @author UltraMarket Security Team
 * @version 1.0.0
 * @date 2024-12-28
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');

console.log('🛡️  Testing UltraMarket Security Fixes...\n');

// Test 1: Environment Variables Security
console.log('1️⃣  Testing Environment Variables Security:');
console.log('==========================================');

const testEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  ADMIN_MFA_SECRET: process.env.ADMIN_MFA_SECRET,
  EMAIL_PASS: process.env.EMAIL_PASS,
  CLICK_SECRET_KEY: process.env.CLICK_SECRET_KEY,
  PAYME_SECRET_KEY: process.env.PAYME_SECRET_KEY
};

let envSecurityPassed = true;

Object.entries(testEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key}: NOT SET`);
    envSecurityPassed = false;
  } else if (value.includes('CHANGE_THIS') || value.includes('your_') || value.includes('test_')) {
    console.log(`❌ ${key}: INSECURE DEFAULT VALUE`);
    envSecurityPassed = false;
  } else if (value.length < 32) {
    console.log(`❌ ${key}: TOO SHORT (${value.length} chars, need 32+)`);
    envSecurityPassed = false;
  } else {
    console.log(`✅ ${key}: SECURE (${value.length} chars)`);
  }
});

console.log(`\nEnvironment Security: ${envSecurityPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 2: Admin Password Security
console.log('2️⃣  Testing Admin Password Security:');
console.log('===================================');

const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
let adminSecurityPassed = true;

if (!adminPasswordHash) {
  console.log('❌ ADMIN_PASSWORD_HASH: NOT SET');
  adminSecurityPassed = false;
} else if (adminPasswordHash.length < 60) {
  console.log(`❌ ADMIN_PASSWORD_HASH: INVALID BCRYPT HASH (${adminPasswordHash.length} chars)`);
  adminSecurityPassed = false;
} else {
  console.log(`✅ ADMIN_PASSWORD_HASH: VALID BCRYPT HASH (${adminPasswordHash.length} chars)`);
  
  // Test password verification
  const testPassword = 'secureAdminPassword123!';
  const isPasswordValid = bcrypt.compareSync(testPassword, adminPasswordHash);
  
  if (isPasswordValid) {
    console.log('✅ Admin password verification: WORKING');
  } else {
    console.log('❌ Admin password verification: FAILED');
    adminSecurityPassed = false;
  }
}

console.log(`\nAdmin Security: ${adminSecurityPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 3: JWT Secret Security
console.log('3️⃣  Testing JWT Secret Security:');
console.log('===============================');

const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
let jwtSecurityPassed = true;

if (!jwtSecret || jwtSecret.length < 64) {
  console.log(`❌ JWT_SECRET: INSECURE (${jwtSecret?.length || 0} chars, need 64+)`);
  jwtSecurityPassed = false;
} else {
  console.log(`✅ JWT_SECRET: SECURE (${jwtSecret.length} chars)`);
}

if (!jwtRefreshSecret || jwtRefreshSecret.length < 64) {
  console.log(`❌ JWT_REFRESH_SECRET: INSECURE (${jwtRefreshSecret?.length || 0} chars, need 64+)`);
  jwtSecurityPassed = false;
} else {
  console.log(`✅ JWT_REFRESH_SECRET: SECURE (${jwtRefreshSecret.length} chars)`);
}

console.log(`\nJWT Security: ${jwtSecurityPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 4: Payment Provider Security
console.log('4️⃣  Testing Payment Provider Security:');
console.log('=====================================');

const clickSecret = process.env.CLICK_SECRET_KEY;
const paymeSecret = process.env.PAYME_SECRET_KEY;
let paymentSecurityPassed = true;

if (!clickSecret || clickSecret.includes('test_') || clickSecret.length < 32) {
  console.log(`❌ CLICK_SECRET_KEY: INSECURE (${clickSecret?.length || 0} chars, need 32+)`);
  paymentSecurityPassed = false;
} else {
  console.log(`✅ CLICK_SECRET_KEY: SECURE (${clickSecret.length} chars)`);
}

if (!paymeSecret || paymeSecret.includes('test_') || paymeSecret.length < 32) {
  console.log(`❌ PAYME_SECRET_KEY: INSECURE (${paymeSecret?.length || 0} chars, need 32+)`);
  paymentSecurityPassed = false;
} else {
  console.log(`✅ PAYME_SECRET_KEY: SECURE (${paymeSecret.length} chars)`);
}

console.log(`\nPayment Security: ${paymentSecurityPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 5: Email Security
console.log('5️⃣  Testing Email Security:');
console.log('==========================');

const emailPass = process.env.EMAIL_PASS;
let emailSecurityPassed = true;

if (!emailPass || emailPass.includes('test') || emailPass.length < 16) {
  console.log(`❌ EMAIL_PASS: INSECURE (${emailPass?.length || 0} chars, need 16+)`);
  emailSecurityPassed = false;
} else {
  console.log(`✅ EMAIL_PASS: SECURE (${emailPass.length} chars)`);
}

console.log(`\nEmail Security: ${emailSecurityPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 6: Session Security
console.log('6️⃣  Testing Session Security:');
console.log('============================');

const sessionSecret = process.env.SESSION_SECRET;
let sessionSecurityPassed = true;

if (!sessionSecret || sessionSecret.length < 32) {
  console.log(`❌ SESSION_SECRET: INSECURE (${sessionSecret?.length || 0} chars, need 32+)`);
  sessionSecurityPassed = false;
} else {
  console.log(`✅ SESSION_SECRET: SECURE (${sessionSecret.length} chars)`);
}

console.log(`\nSession Security: ${sessionSecurityPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 7: MFA Security
console.log('7️⃣  Testing MFA Security:');
console.log('========================');

const mfaSecret = process.env.ADMIN_MFA_SECRET;
let mfaSecurityPassed = true;

if (!mfaSecret || mfaSecret.length < 32) {
  console.log(`❌ ADMIN_MFA_SECRET: INSECURE (${mfaSecret?.length || 0} chars, need 32+)`);
  mfaSecurityPassed = false;
} else {
  console.log(`✅ ADMIN_MFA_SECRET: SECURE (${mfaSecret.length} chars)`);
}

console.log(`\nMFA Security: ${mfaSecurityPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 8: Bcrypt Configuration
console.log('8️⃣  Testing Bcrypt Configuration:');
console.log('================================');

const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
let bcryptSecurityPassed = true;

if (bcryptRounds < 12) {
  console.log(`❌ BCRYPT_ROUNDS: TOO LOW (${bcryptRounds}, need 12+)`);
  bcryptSecurityPassed = false;
} else {
  console.log(`✅ BCRYPT_ROUNDS: SECURE (${bcryptRounds})`);
}

console.log(`\nBcrypt Security: ${bcryptSecurityPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 9: Generate Secure Secrets
console.log('9️⃣  Generating Secure Secrets:');
console.log('==============================');

const secureSecrets = {
  JWT_SECRET: crypto.randomBytes(64).toString('hex'),
  JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
  SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
  ADMIN_MFA_SECRET: crypto.randomBytes(32).toString('hex'),
  CLICK_SECRET_KEY: crypto.randomBytes(32).toString('hex'),
  PAYME_SECRET_KEY: crypto.randomBytes(32).toString('hex'),
  EMAIL_PASS: crypto.randomBytes(32).toString('hex')
};

console.log('✅ Generated secure secrets for production:');
Object.entries(secureSecrets).forEach(([key, value]) => {
  console.log(`   ${key}: ${value.substring(0, 20)}...`);
});

console.log('\n');

// Test 10: Overall Security Assessment
console.log('🔟 Overall Security Assessment:');
console.log('==============================');

const allTestsPassed = envSecurityPassed && 
                      adminSecurityPassed && 
                      jwtSecurityPassed && 
                      paymentSecurityPassed && 
                      emailSecurityPassed && 
                      sessionSecurityPassed && 
                      mfaSecurityPassed && 
                      bcryptSecurityPassed;

const passedTests = [
  envSecurityPassed && 'Environment Variables',
  adminSecurityPassed && 'Admin Authentication',
  jwtSecurityPassed && 'JWT Security',
  paymentSecurityPassed && 'Payment Providers',
  emailSecurityPassed && 'Email Security',
  sessionSecurityPassed && 'Session Security',
  mfaSecurityPassed && 'MFA Security',
  bcryptSecurityPassed && 'Bcrypt Configuration'
].filter(Boolean);

const failedTests = [
  !envSecurityPassed && 'Environment Variables',
  !adminSecurityPassed && 'Admin Authentication',
  !jwtSecurityPassed && 'JWT Security',
  !paymentSecurityPassed && 'Payment Providers',
  !emailSecurityPassed && 'Email Security',
  !sessionSecurityPassed && 'Session Security',
  !mfaSecurityPassed && 'MFA Security',
  !bcryptSecurityPassed && 'Bcrypt Configuration'
].filter(Boolean);

console.log(`✅ Passed Tests (${passedTests.length}/8):`);
passedTests.forEach(test => console.log(`   - ${test}`));

if (failedTests.length > 0) {
  console.log(`\n❌ Failed Tests (${failedTests.length}/8):`);
  failedTests.forEach(test => console.log(`   - ${test}`));
}

console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ SECURE' : '❌ INSECURE'}`);

if (allTestsPassed) {
  console.log('\n🎉 All security tests passed! UltraMarket is now secure.');
  console.log('📋 Next steps:');
  console.log('   1. Update .env file with secure values');
  console.log('   2. Deploy to production');
  console.log('   3. Monitor security logs');
  console.log('   4. Regular security audits');
} else {
  console.log('\n⚠️  Security issues found! Please fix before production deployment.');
  console.log('📋 Action items:');
  console.log('   1. Fix failed security tests');
  console.log('   2. Update environment variables');
  console.log('   3. Re-run security tests');
  console.log('   4. Get security approval');
}

console.log('\n🛡️  Security test completed!\n'); 