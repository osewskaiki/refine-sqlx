/**
 * refine-sqlx Basic Usage Example
 * 
 * refine-sqlx is a lightweight package for SQLite and Cloudflare D1 environments
 * Fully compatible with refine-orm API, making migration from refine-orm easy
 */

import { createRefineSQL } from '../packages/refine-sqlx/src/index.js';

async function main() {
  console.log('🚀 refine-sqlx - SQLite/D1 精简包示例\n');

  try {
    // ========== Auto-detect Runtime Environment ==========
    console.log('1️⃣ Auto-detect SQLite Environment (Recommended)');
    const provider = createRefineSQL(':memory:');
    
    console.log('   ✅ Auto-detect and create adapter');
    console.log('   🔧 Supports: Bun SQLite, Node.js better-sqlite3, Cloudflare D1');
    console.log('   📝 Usage: provider.getOne({ resource: "users", id: 1 })\n');

    // ========== refine-orm Compatible API ==========
    console.log('2️⃣ refine-orm Compatible API (Fully Compatible)');
    
    // Standard Refine DataProvider API
    console.log('   📋 Standard CRUD Operations:');
    console.log('     - getList: await provider.getList({ resource: "users" })');
    console.log('     - getOne: await provider.getOne({ resource: "users", id: 1 })');
    console.log('     - create: await provider.create({ resource: "users", variables: {...} })');
    console.log('     - update: await provider.update({ resource: "users", id: 1, variables: {...} })');
    console.log('     - deleteOne: await provider.deleteOne({ resource: "users", id: 1 })\n');

    // ========== Chain Query API (Compatible with refine-orm) ==========
    console.log('3️⃣ Chain Query API (Compatible with refine-orm)');
    const chainQuery = provider.from('users')
      .whereEq('status', 'active')        // refine-orm compatible method
      .whereGt('age', 18)                 // refine-orm compatible method
      .orderByDesc('created_at')          // refine-orm compatible method
      .limit(10);
    
    console.log('   ✅ Chain query built successfully (using refine-orm compatible API)');
    console.log('   📝 Execute: await chainQuery.get()\n');

    // ========== Relationship Queries (Compatible with refine-orm) ==========
    console.log('4️⃣ Relationship Queries (Compatible with refine-orm)');
    console.log('   📝 belongsTo: provider.from("posts").withBelongsTo("author", "users")');
    console.log('   📝 hasMany: provider.from("users").withHasMany("posts", "posts")');
    console.log('   📝 Execute: await query.getWithRelations()\n');

    // ========== Environment-Specific Optimizations ==========
    console.log('5️⃣ Environment-Specific Optimizations');
    console.log('   ⚡ Bun: Uses built-in bun:sqlite, zero configuration');
    console.log('   ⚡ Node.js: Uses better-sqlite3, high performance');
    console.log('   ⚡ Cloudflare D1: Edge computing optimized, low latency\n');

    console.log('🎉 refine-sqlx example completed!');
    console.log('💡 Tip: Fully compatible with refine-orm API, zero-cost migration');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run example if this file is executed directly
if (import.meta.main) {
  main();
}