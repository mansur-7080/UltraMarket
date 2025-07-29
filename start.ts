#!/usr/bin/env ts-node

import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

interface ServiceConfig {
  name: string;
  port: number;
  command: string;
  cwd: string;
  healthCheck: string;
  tier: 1 | 2 | 3;
  priority: number;
}

class UltraMarketProfessional {
  private services: ServiceConfig[] = [
    // TIER 1 - CORE RUNTIME (Minimal Working System)
    {
      name: 'Auth Service',
      port: 3001,
      command: 'ts-node src/index.ts',
      cwd: 'services/core/auth-service',
      healthCheck: 'http://localhost:3001/health',
      tier: 1,
      priority: 1,
    },
    {
      name: 'Product Service',
      port: 3002,
      command: 'ts-node src/index.ts',
      cwd: 'services/business/product-service',
      healthCheck: 'http://localhost:3002/health',
      tier: 1,
      priority: 2,
    },
    {
      name: 'API Gateway',
      port: 3007,
      command: 'ts-node src/main.ts', 
      cwd: 'services/core/api-gateway',
      healthCheck: 'http://localhost:3007/health',
      tier: 1,
      priority: 3
    },
    {
      name: 'Web Frontend',
      port: 5173,
      command: 'npm run dev',
      cwd: 'frontend/web-app',
      healthCheck: 'http://localhost:5173',
      tier: 1,
      priority: 4
    },

    // TIER 2 - BUSINESS LAYER (Extended Features)  
    {
      name: 'Cart Service',
      port: 3003,
      command: 'ts-node src/main.ts',
      cwd: 'services/business/cart-service',
      healthCheck: 'http://localhost:3003/health',
      tier: 2,
      priority: 5
    },
    {
      name: 'Order Service',
      port: 3004,
      command: 'ts-node src/main.ts',
      cwd: 'services/business/order-service',
      healthCheck: 'http://localhost:3004/health',
      tier: 2,
      priority: 6
    },
    {
      name: 'Payment Service',
      port: 3005,
      command: 'ts-node src/main.ts',
      cwd: 'services/business/payment-service',
      healthCheck: 'http://localhost:3005/health',
      tier: 2,
      priority: 7
    },
    {
      name: 'Admin Panel',
      port: 5174,
      command: 'npm run dev',
      cwd: 'frontend/admin-panel',
      healthCheck: 'http://localhost:5174',
      tier: 2,
      priority: 8
    },

    // TIER 3 - ADVANCED LAYER (Future Features)
    {
      name: 'Analytics Service',
      port: 3006,
      command: 'ts-node src/main.ts',
      cwd: 'services/analytics/analytics-service',
      healthCheck: 'http://localhost:3006/health',
      tier: 3,
      priority: 9
    },
    {
      name: 'Mobile App Dev Server',
      port: 5175,
      command: 'npm run dev',
      cwd: 'frontend/mobile-app',
      healthCheck: 'http://localhost:5175',
      tier: 3,
      priority: 10
    }
  ];

  private runningProcesses: Map<string, ChildProcess> = new Map();
  private mode: 'minimal' | 'business' | 'full' = 'minimal';

  constructor(mode: 'minimal' | 'business' | 'full' = 'minimal') {
    this.mode = mode;
    console.log('🚀 UltraMarket Professional Platform');
    console.log('════════════════════════════════════════');
    console.log(`📊 Mode: ${mode.toUpperCase()}`);
    console.log(`🎯 Tiers: ${this.getTierDescription()}`);
  }

  private getTierDescription(): string {
    switch (this.mode) {
      case 'minimal': return 'TIER 1 (Core Only)';
      case 'business': return 'TIER 1-2 (Core + Business)';
      case 'full': return 'TIER 1-3 (All Features)';
    }
  }

  private getServicesForMode(): ServiceConfig[] {
    switch (this.mode) {
      case 'minimal': 
        return this.services.filter(s => s.tier === 1);
      case 'business': 
        return this.services.filter(s => s.tier <= 2);
      case 'full': 
        return this.services;
    }
  }

  async startService(service: ServiceConfig): Promise<boolean> {
    console.log(`\n📦 [TIER ${service.tier}] ${service.name} ishga tushirilmoqda...`);
    console.log(`🌐 Port: ${service.port}`);
    console.log(`📁 Directory: ${service.cwd}`);
    console.log(`⚡ Command: ${service.command}`);

    const fullPath = path.resolve(service.cwd);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ Directory topilmadi: ${fullPath}`);
      console.log(`⚠️  TIER ${service.tier} service mavjud emas, o'tkazib yuborildi`);
      return false;
    }

    try {
      const env = { 
        ...process.env, 
        PORT: service.port.toString(),
        NODE_ENV: 'development' as const,
        TIER: service.tier.toString()
      };

      const [cmd, ...args] = service.command.split(' ');
      
      const childProcess = spawn(cmd, args, {
        cwd: fullPath,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      }) as ChildProcess;

      this.runningProcesses.set(service.name, childProcess);

      childProcess.stdout?.on('data', (data) => {
        console.log(`[TIER ${service.tier}][${service.name}] ${data.toString().trim()}`);
      });

      childProcess.stderr?.on('data', (data) => {
        console.log(`[TIER ${service.tier}][${service.name}] ⚠️  ${data.toString().trim()}`);
      });

      childProcess.on('error', (error) => {
        console.log(`❌ [TIER ${service.tier}] ${service.name} xato: ${error.message}`);
      });

      childProcess.on('exit', (code) => {
        console.log(`🛑 [TIER ${service.tier}] ${service.name} to'xtadi (code: ${code})`);
        this.runningProcesses.delete(service.name);
      });

      // Wait for service to start
      await this.waitForDelay(5000);
      
      // Check if service is healthy
      const isHealthy = await this.checkHealth(service);
      if (isHealthy) {
        console.log(`✅ [TIER ${service.tier}] ${service.name} HEALTHY!`);
        console.log(`🔗 URL: ${service.healthCheck}`);
        return true;
      } else {
        console.log(`⚠️  [TIER ${service.tier}] ${service.name} ishga tushdi, lekin health check failed`);
        return false;
      }

    } catch (error) {
      console.log(`❌ [TIER ${service.tier}] ${service.name} ishga tushirishda xato:`, error);
      return false;
    }
  }

  async checkHealth(service: ServiceConfig): Promise<boolean> {
    try {
      console.log(`🔍 [TIER ${service.tier}] ${service.name} health check...`);
      
      // Try multiple times with longer timeout
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${service.healthCheck} --connect-timeout 10 --max-time 15`);
          const statusCode = stdout.trim();
          
          if (statusCode === '200') {
            return true;
          } else {
            console.log(`⚠️  [TIER ${service.tier}] ${service.name} health check attempt ${attempt}: status ${statusCode}`);
          }
        } catch (error) {
          console.log(`⚠️  [TIER ${service.tier}] ${service.name} health check attempt ${attempt} failed: ${error}`);
        }
        
        if (attempt < 3) {
          await this.waitForDelay(2000); // Wait 2 seconds between attempts
        }
      }
      
      return false;
    } catch (error) {
      console.log(`❌ [TIER ${service.tier}] ${service.name} health check failed: ${error}`);
      return false;
    }
  }

  async waitForDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async startAll(): Promise<void> {
    const servicesToStart = this.getServicesForMode().sort((a, b) => a.priority - b.priority);
    
    console.log(`\n🎯 ${this.mode.toUpperCase()} MODE - ${servicesToStart.length} SERVICES ISHGA TUSHIRILMOQDA\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < servicesToStart.length; i++) {
      const service = servicesToStart[i];
      
      console.log(`\n${i + 1}/${servicesToStart.length} - [TIER ${service.tier}] ${service.name}...`);
      const success = await this.startService(service);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      if (i < servicesToStart.length - 1) {
        console.log('\n⏳ Keyingi service uchun kutilmoqda...');
        await this.waitForDelay(2000);
      }
    }

    await this.showStatus(successCount, failCount);
  }

  async showStatus(successCount: number, failCount: number): Promise<void> {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log(`║              🎉 ULTRAMARKET ${this.mode.toUpperCase()} READY! 🎉             ║`);
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    console.log(`\n📊 STATISTICS:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   🏃 Running: ${this.runningProcesses.size}`);

    console.log('\n🌐 ACTIVE SERVICES:');
    const activeServices = this.getServicesForMode().filter(s => this.runningProcesses.has(s.name));
    
    const tier1 = activeServices.filter(s => s.tier === 1);
    const tier2 = activeServices.filter(s => s.tier === 2);
    const tier3 = activeServices.filter(s => s.tier === 3);

    if (tier1.length > 0) {
      console.log('\n   🔧 TIER 1 (CORE):');
      tier1.forEach(s => console.log(`      ✅ ${s.name}: ${s.healthCheck}`));
    }

    if (tier2.length > 0) {
      console.log('\n   💼 TIER 2 (BUSINESS):');
      tier2.forEach(s => console.log(`      ✅ ${s.name}: ${s.healthCheck}`));
    }

    if (tier3.length > 0) {
      console.log('\n   🚀 TIER 3 (ADVANCED):');
      tier3.forEach(s => console.log(`      ✅ ${s.name}: ${s.healthCheck}`));
    }

    console.log('\n🧪 QUICK TESTS:');
    activeServices.forEach(s => {
      console.log(`   curl ${s.healthCheck}`);
    });
  }

  async stop(): Promise<void> {
    console.log('\n🛑 Professional shutdown...');
    
    for (const [name, process] of this.runningProcesses) {
      console.log(`🛑 ${name} to'xtatilmoqda...`);
      process.kill('SIGTERM');
    }

    await this.waitForDelay(3000);
    
    // Force kill if still running
    for (const [name, process] of this.runningProcesses) {
      if (!process.killed) {
        console.log(`🔥 ${name} majburan to'xtatilmoqda...`);
        process.kill('SIGKILL');
      }
    }

    console.log('✅ Professional shutdown complete');
    process.exit(0);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 UltraMarket Professional Platform

USAGE:
  ts-node start.ts [mode] [options]

MODES:
  minimal     TIER 1 only (Auth + Product + Gateway + Web)
  business    TIER 1-2 (+ Cart + Order + Payment + Admin)  
  full        TIER 1-3 (+ Analytics + Mobile + All Features)

OPTIONS:
  --help, -h  Show this help

EXAMPLES:
  ts-node start.ts                    # Default: minimal mode
  ts-node start.ts minimal           # TIER 1 only
  ts-node start.ts business          # TIER 1-2
  ts-node start.ts full              # TIER 1-3 (All)

TIER STRUCTURE:
  🔧 TIER 1 (CORE):      Auth, Product, Gateway, Web Frontend
  💼 TIER 2 (BUSINESS):  Cart, Order, Payment, Admin Panel
  🚀 TIER 3 (ADVANCED):  Analytics, ML-AI, Mobile App

CTRL+C to stop all services.
    `);
    process.exit(0);
  }

  // Determine mode
  let mode: 'minimal' | 'business' | 'full' = 'minimal';
  if (args.includes('business')) mode = 'business';
  if (args.includes('full')) mode = 'full';

  const platform = new UltraMarketProfessional(mode);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Ctrl+C - Professional shutdown...');
    await platform.stop();
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 SIGTERM - Professional shutdown...');
    await platform.stop();
  });

  try {
    await platform.startAll();
    
    console.log('\n⏳ Platform is running. CTRL+C to stop...');
    console.log(`🎯 Mode: ${mode} | Professional structure maintained`);
    
    // Keep process alive
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Professional startup failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default UltraMarketProfessional;
const HOST = process.env['HOST'] ?? '0.0.0.0';