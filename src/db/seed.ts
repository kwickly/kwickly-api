import { db } from './index.ts';
import * as schema from './schema/index.ts';

async function main() {
  console.log('🌱 Seeding database with upsert strategy...');

  // 1. Seed Tenants
  console.log('🏢 Seeding tenants...');
  const [swamyTenant] = await db.insert(schema.tenants).values([
    {
      name: 'Swamy Restaurant',
      slug: 'swamy',
      email: 'admin@swamy.com',
      plan: 'GROWTH',
    },
  ]).onConflictDoUpdate({
    target: schema.tenants.slug,
    set: { name: 'Swamy Restaurant', email: 'admin@swamy.com', plan: 'GROWTH' }
  }).returning();

  if (!swamyTenant) throw new Error('Failed to seed swamyTenant');

  const [kwicklyTenant] = await db.insert(schema.tenants).values([
    {
      name: 'Kwickly HQ',
      slug: 'kwickly',
      email: 'hello@kwickly.com',
      plan: 'ENTERPRISE',
    },
  ]).onConflictDoUpdate({
    target: schema.tenants.slug,
    set: { name: 'Kwickly HQ', email: 'hello@kwickly.com', plan: 'ENTERPRISE' }
  }).returning();

  if (!kwicklyTenant) throw new Error('Failed to seed kwicklyTenant');

  // 2. Seed Branches
  console.log('📍 Seeding branches...');
  const [swamyMainBranch] = await db.insert(schema.branches).values([
    {
      tenantId: swamyTenant.id,
      name: 'Main Branch (Vashi)',
      address: 'Vashi, Navi Mumbai',
      phone: '9876543210',
    },
  ]).onConflictDoUpdate({
    target: [schema.branches.tenantId, schema.branches.name],
    set: { address: 'Vashi, Navi Mumbai', phone: '9876543210' }
  }).returning();

  if (!swamyMainBranch) throw new Error('Failed to seed swamyMainBranch');

  // 3. Seed Roles & Permissions
  console.log('🔐 Seeding RBAC...');
  const [manageMenuPerm] = await db.insert(schema.permissions).values([
    { name: 'Manage Menu', slug: 'menu:write', description: 'Can add/edit/delete menu items' },
  ]).onConflictDoUpdate({
    target: schema.permissions.slug,
    set: { name: 'Manage Menu', description: 'Can add/edit/delete menu items' }
  }).returning();

  const [viewOrdersPerm] = await db.insert(schema.permissions).values([
    { name: 'View Orders', slug: 'orders:read', description: 'Can view order history' },
  ]).onConflictDoUpdate({
    target: schema.permissions.slug,
    set: { name: 'View Orders', description: 'Can view order history' }
  }).returning();

  if (!manageMenuPerm || !viewOrdersPerm) throw new Error('Failed to seed permissions');

  const [managerRole] = await db.insert(schema.roles).values([
    { name: 'Branch Manager', slug: 'branch_manager' },
  ]).onConflictDoUpdate({
    target: schema.roles.slug,
    set: { name: 'Branch Manager' }
  }).returning();

  if (!managerRole) throw new Error('Failed to seed managerRole');

  await db.insert(schema.rolePermissions).values([
    { roleId: managerRole.id, permissionId: manageMenuPerm.id },
    { roleId: managerRole.id, permissionId: viewOrdersPerm.id },
  ]).onConflictDoNothing();

  // 4. Seed Users
  console.log('👤 Seeding users...');
  const mockPassword = await Bun.password.hash('Test@12345');

  await db.insert(schema.users).values([
    {
      name: 'Super Admin',
      email: 'admin@kwickly.com',
      phone: '0000000000',
      password: mockPassword,
      role: 'super_admin',
    },
  ]).onConflictDoUpdate({
    target: schema.users.phone,
    set: { name: 'Super Admin', email: 'admin@kwickly.com', role: 'super_admin', password: mockPassword }
  });

  await db.insert(schema.users).values([
    {
      tenantId: swamyTenant.id,
      name: 'Swamy Owner',
      email: 'owner@swamy.com',
      phone: '1111111111',
      password: mockPassword,
      role: 'tenant_owner',
    },
  ]).onConflictDoUpdate({
    target: schema.users.phone,
    set: { name: 'Swamy Owner', email: 'owner@swamy.com', role: 'tenant_owner', password: mockPassword }
  });

  await db.insert(schema.users).values([
    {
      tenantId: swamyTenant.id,
      branchId: swamyMainBranch.id,
      name: 'Vashi Manager',
      email: 'manager@swamy.com',
      phone: '2222222222',
      password: mockPassword,
      role: 'manager',
    },
  ]).onConflictDoUpdate({
    target: schema.users.phone,
    set: { name: 'Vashi Manager', email: 'manager@swamy.com', role: 'manager', branchId: swamyMainBranch.id, password: mockPassword }
  });

  // 5. Seed Menus
  console.log('🍴 Seeding menus...');
  const [startersCategory] = await db.insert(schema.menuCategories).values([
    {
      tenantId: swamyTenant.id,
      branchId: swamyMainBranch.id,
      name: 'Starters',
      sortOrder: 1,
    },
  ]).onConflictDoUpdate({
    target: [schema.menuCategories.tenantId, schema.menuCategories.branchId, schema.menuCategories.name],
    set: { sortOrder: 1 }
  }).returning();

  if (!startersCategory) throw new Error('Failed to seed startersCategory');

  const [mainCourseCategory] = await db.insert(schema.menuCategories).values([
    {
      tenantId: swamyTenant.id,
      branchId: swamyMainBranch.id,
      name: 'Main Course',
      sortOrder: 2,
    },
  ]).onConflictDoUpdate({
    target: [schema.menuCategories.tenantId, schema.menuCategories.branchId, schema.menuCategories.name],
    set: { sortOrder: 2 }
  }).returning();

  if (!mainCourseCategory) throw new Error('Failed to seed mainCourseCategory');

  const [beveragesCategory] = await db.insert(schema.menuCategories).values([
    {
      tenantId: swamyTenant.id,
      branchId: swamyMainBranch.id,
      name: 'Beverages',
      sortOrder: 3,
    },
  ]).onConflictDoUpdate({
    target: [schema.menuCategories.tenantId, schema.menuCategories.branchId, schema.menuCategories.name],
    set: { sortOrder: 3 }
  }).returning();

  if (!beveragesCategory) throw new Error('Failed to seed beveragesCategory');

  const items = [
    {
      tenantId: swamyTenant.id,
      categoryId: startersCategory.id,
      name: 'Paneer Tikka',
      description: 'Grilled cottage cheese with spices',
      price: '250.00',
      isVeg: true,
      sortOrder: 1,
    },
    {
      tenantId: swamyTenant.id,
      categoryId: startersCategory.id,
      name: 'Chicken Lollipop',
      description: 'Fried chicken drumettes',
      price: '300.00',
      isVeg: false,
      sortOrder: 2,
    },
    {
      tenantId: swamyTenant.id,
      categoryId: mainCourseCategory.id,
      name: 'Dal Makhani',
      description: 'Slow cooked black lentils',
      price: '220.00',
      isVeg: true,
      sortOrder: 1,
    },
    {
      tenantId: swamyTenant.id,
      categoryId: mainCourseCategory.id,
      name: 'Butter Chicken',
      description: 'Creamy chicken curry',
      price: '350.00',
      isVeg: false,
      sortOrder: 2,
    },
    {
      tenantId: swamyTenant.id,
      categoryId: beveragesCategory.id,
      name: 'Masala Chai',
      description: 'Indian spiced tea',
      price: '40.00',
      isVeg: true,
      sortOrder: 1,
    },
    {
      tenantId: swamyTenant.id,
      categoryId: beveragesCategory.id,
      name: 'Fresh Lime Soda',
      description: 'Refreshing lime drink',
      price: '80.00',
      isVeg: true,
      sortOrder: 2,
    },
  ];

  for (const item of items) {
    await db.insert(schema.menuItems).values(item).onConflictDoUpdate({
      target: [schema.menuItems.tenantId, schema.menuItems.categoryId, schema.menuItems.name],
      set: { description: item.description, price: item.price, isVeg: item.isVeg, sortOrder: item.sortOrder }
    });
  }

  console.log('✅ Seeding completed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:');
  console.error(err);
  process.exit(1);
});
