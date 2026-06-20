import { db } from './index.ts';
import * as schema from './schema/index.ts';
import { faker } from '@faker-js/faker';

async function main() {
  console.log('🌱 Starting comprehensive database seeding with Faker.js...');

  // 1. Stable Test Data (Things we need for manual testing)
  console.log('🏢 Seeding stable Tenants...');
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

  console.log('📍 Seeding stable Branches...');
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

  // 3. RBAC Seed
  console.log('🔐 Seeding Granular RBAC...');
  const permissionsData = [
    // Menu Management
    { name: 'View Menu', slug: 'menu:read', description: 'Can view menu items and categories' },
    { name: 'Manage Menu', slug: 'menu:write', description: 'Can add/edit/delete menu items and categories' },
    // Order Management
    { name: 'View Orders', slug: 'orders:read', description: 'Can view order history' },
    { name: 'Manage Orders', slug: 'orders:write', description: 'Can create/update orders' },
    // Staff Management
    { name: 'View Staff', slug: 'staff:read', description: 'Can view staff profiles' },
    { name: 'Manage Staff', slug: 'staff:write', description: 'Can manage staff profiles' },
    // Analytics
    { name: 'View Analytics', slug: 'analytics:read', description: 'Can view branch analytics' },
    // Inventory
    { name: 'View Inventory', slug: 'inventory:read', description: 'Can view stock levels' },
    { name: 'Manage Inventory', slug: 'inventory:write', description: 'Can update stock levels' },
    // Billing & Payments
    { name: 'Manage Billing', slug: 'billing:manage', description: 'Can manage invoices and payments' },
    // Settings
    { name: 'Manage Settings', slug: 'settings:manage', description: 'Can update branch/tenant settings' },
    // Attendance & Payroll
    { name: 'Manage Attendance', slug: 'attendance:manage', description: 'Can view and edit staff attendance' },
    { name: 'Manage Payroll', slug: 'payroll:manage', description: 'Can process payroll and salary slips' },
    // CRM & Promotions
    { name: 'Manage CRM', slug: 'crm:manage', description: 'Can view and manage customer data' },
    { name: 'Manage Promotions', slug: 'promotions:manage', description: 'Can create coupons and ads' },
    // Subscriptions
    { name: 'Manage Subscriptions', slug: 'subscriptions:manage', description: 'Can manage SaaS plans' },
  ];

  const seededPermissions = [];
  for (const perm of permissionsData) {
    const [p] = await db.insert(schema.permissions).values(perm).onConflictDoUpdate({
      target: schema.permissions.slug,
      set: perm
    }).returning();
    if (p) seededPermissions.push(p);
  }

  const systemRolesData = [
    { name: 'Platform Owner', slug: 'platform_owner', isSystem: true },
    { name: 'Super Admin', slug: 'super_admin', isSystem: true },
    { name: 'Tenant Owner', slug: 'tenant_owner', isSystem: true },
    { name: 'Branch Manager', slug: 'manager', isSystem: true },
    { name: 'Cashier', slug: 'cashier', isSystem: true },
    { name: 'Kitchen Staff', slug: 'kitchen_staff', isSystem: true },
    { name: 'QR Scanner', slug: 'qr_scanner', isSystem: true },
  ];

  const seededRoles: Record<string, any> = {};
  for (const role of systemRolesData) {
    const [r] = await db.insert(schema.roles).values(role).onConflictDoUpdate({
      target: [schema.roles.slug, schema.roles.tenantId],
      set: { name: role.name, isSystem: true }
    }).returning();
    if (r) seededRoles[role.slug] = r;
  }

  // Assign Permissions to Roles
  console.log('🔗 Mapping Permissions to Roles...');
  
  // Platform Owner, Super Admin, Tenant Owner get ALL permissions
  const allPermissions = seededPermissions.map(p => p.id);
  const fullAccessRoles = ['platform_owner', 'super_admin', 'tenant_owner'];
  
  for (const slug of fullAccessRoles) {
    if (seededRoles[slug]) {
      await db.insert(schema.rolePermissions).values(
        allPermissions.map(permissionId => ({ roleId: seededRoles[slug].id, permissionId }))
      ).onConflictDoNothing();
    }
  }

  // Branch Manager permissions
  const managerPermissions = seededPermissions.filter(p => 
    ['menu:read', 'menu:write', 'orders:read', 'orders:write', 'staff:read', 'analytics:read', 'inventory:read', 'inventory:write', 'billing:manage'].includes(p.slug)
  ).map(p => p.id);
  
  if (seededRoles['manager']) {
    await db.insert(schema.rolePermissions).values(
      managerPermissions.map(permissionId => ({ roleId: seededRoles['manager'].id, permissionId }))
    ).onConflictDoNothing();
  }

  // Cashier permissions
  const cashierPermissions = seededPermissions.filter(p => 
    ['menu:read', 'orders:read', 'orders:write', 'billing:manage'].includes(p.slug)
  ).map(p => p.id);
  
  if (seededRoles['cashier']) {
    await db.insert(schema.rolePermissions).values(
      cashierPermissions.map(permissionId => ({ roleId: seededRoles['cashier'].id, permissionId }))
    ).onConflictDoNothing();
  }

  // 4. Stable Users
  console.log('👤 Seeding stable users...');
  const mockPassword = await Bun.password.hash('Test@12345');

  const stableUsers = [
    {
      name: 'Super Admin',
      email: 'admin@kwickly.com',
      phone: '0000000000',
      password: mockPassword,
      role: 'super_admin' as const,
    },
    {
      name: 'Platform Owner',
      email: 'cvs@kwickly.com',
      phone: '9999999999',
      password: mockPassword,
      role: 'platform_owner' as const,
    },
    {
      tenantId: swamyTenant.id,
      name: 'Swamy Owner',
      email: 'owner@swamy.com',
      phone: '1111111111',
      password: mockPassword,
      role: 'tenant_owner' as const,
    },
    {
      tenantId: swamyTenant.id,
      branchId: swamyMainBranch.id,
      name: 'Vashi Manager',
      email: 'manager@swamy.com',
      phone: '2222222222',
      password: mockPassword,
      role: 'staff' as const,
      roleId: seededRoles['manager'].id,
    }
  ];

  for (const user of stableUsers) {
    await db.insert(schema.users).values(user).onConflictDoUpdate({
      target: schema.users.phone,
      set: user
    });
  }

  // 5. Generated Mock Data
  console.log('🎲 Generating randomized mock data...');

  // Mock Tenants
  console.log('   - More Tenants...');
  const mockTenants = await db.insert(schema.tenants).values(
    Array.from({ length: 5 }).map(() => ({
      name: faker.company.name(),
      slug: faker.lorem.slug(),
      email: faker.internet.email(),
      plan: faker.helpers.arrayElement(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'] as const),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
    }))
  ).returning();

  // Mock Branches
  console.log('   - More Branches...');
  const mockBranches: schema.Branch[] = [];
  for (const t of [...mockTenants, swamyTenant]) {
    if (!t) continue;
    const branches = await db.insert(schema.branches).values(
      Array.from({ length: faker.number.int({ min: 1, max: 2 }) }).map(() => ({
        tenantId: t.id,
        name: faker.company.catchPhraseAdjective() + ' Branch',
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
      }))
    ).returning();
    mockBranches.push(...branches);
  }

  // Mock Users (Staff & Customers)
  console.log('   - Staff & Customers...');
  const allBranches = [...mockBranches, swamyMainBranch];
  const mockUsers = await db.insert(schema.users).values(
    Array.from({ length: 30 }).map(() => {
      const branch = faker.helpers.arrayElement(allBranches);
      if (!branch) throw new Error('No branches found for mock user generation');
      const isCustomer = Math.random() > 0.7;
      const staffRoleSlug = faker.helpers.arrayElement(['cashier', 'kitchen_staff', 'qr_scanner']);
      return {
        tenantId: branch.tenantId,
        branchId: branch.id,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        password: mockPassword,
        role: isCustomer ? 'customer' as const : 'staff' as const,
        roleId: isCustomer ? null : seededRoles[staffRoleSlug].id,
      };
    })
  ).returning();

  // Mock Staff Profiles
  console.log('   - Staff Profiles...');
  const staffUsers = mockUsers.filter(u => u.role !== 'customer');
  for (const user of staffUsers) {
    const joiningDate = faker.date.past({ years: 2 }).toISOString().split('T')[0];
    const salaryType = faker.helpers.arrayElement(['HOURLY', 'MONTHLY'] as const);
    const baseSalary = faker.commerce.price({ min: 15000, max: 50000 });
    const digitalIdToken = faker.string.uuid();

    if (!user.tenantId || !joiningDate || !digitalIdToken) continue;

    await db.insert(schema.staffProfiles).values({
      tenantId: user.tenantId,
      userId: user.id,
      emergencyContact: faker.phone.number(),
      joiningDate: joiningDate,
      salaryType: salaryType,
      baseSalary: baseSalary,
      digitalIdToken: digitalIdToken,
    }).onConflictDoNothing();
  }

  // Mock Menu Categories & Items
  console.log('   - Menus & Categories...');
  for (const tenant of [...mockTenants, swamyTenant]) {
    if (!tenant) continue;
    const categoryData = ['Starters', 'Main Course', 'Desserts', 'Beverages'].map((name, index) => ({
      tenantId: tenant.id,
      name,
      sortOrder: index,
    }));

    const categories: schema.MenuCategory[] = [];
    for (const cat of categoryData) {
      const [insertedCat] = await db.insert(schema.menuCategories).values(cat).onConflictDoUpdate({
        target: [schema.menuCategories.tenantId, schema.menuCategories.name],
        set: { sortOrder: cat.sortOrder }
      }).returning();
      if (insertedCat) categories.push(insertedCat);
    }

    for (const cat of categories) {
      const itemData = Array.from({ length: 3 }).map((_, index) => ({
        tenantId: tenant.id,
        categoryId: cat.id,
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.commerce.price({ min: 100, max: 1000 }),
        isVeg: faker.datatype.boolean(),
        sortOrder: index,
      }));

      const items: schema.MenuItem[] = [];
      for (const item of itemData) {
        const [insertedItem] = await db.insert(schema.menuItems).values(item).onConflictDoUpdate({
          target: [schema.menuItems.tenantId, schema.menuItems.categoryId, schema.menuItems.name],
          set: { description: item.description, price: item.price, isVeg: item.isVeg }
        }).returning();
        if (insertedItem) items.push(insertedItem);
      }

      for (const item of items) {
        await db.insert(schema.menuItemVariants).values([
          { menuItemId: item.id, name: 'Half', priceDelta: '-50.00' },
          { menuItemId: item.id, name: 'Full', priceDelta: '0.00', isDefault: true },
        ]).onConflictDoNothing();

        await db.insert(schema.menuItemAddons).values(
          Array.from({ length: 2 }).map(() => ({
            tenantId: tenant.id,
            menuItemId: item.id,
            name: 'Extra ' + faker.commerce.productAdjective(),
            price: faker.commerce.price({ min: 10, max: 50 }),
          }))
        ).onConflictDoNothing();
      }
    }
  }

  // Mock Inventory
  console.log('   - Inventory & Stock...');
  for (const tenant of [...mockTenants, swamyTenant]) {
    if (!tenant) continue;
    const materials = await db.insert(schema.rawMaterials).values(
      Array.from({ length: 5 }).map(() => ({
        tenantId: tenant.id,
        name: faker.commerce.productMaterial(),
        uom: faker.helpers.arrayElement(['KG', 'GRAM', 'LITER', 'MILLILITER', 'PIECE', 'BOX'] as const),
      }))
    ).returning();

    const tenantBranches = allBranches.filter(b => b && b.tenantId === tenant.id);
    for (const branch of tenantBranches) {
      if (!branch) continue;
      for (const mat of materials) {
        await db.insert(schema.stockLedgers).values({
          tenantId: tenant.id,
          branchId: branch.id,
          rawMaterialId: mat.id,
          quantityChange: faker.number.float({ min: 10, max: 100 }).toFixed(2),
          reason: 'Initial Seed Stock',
        });
      }
    }
  }

  // Mock Orders, KOTs & Payments
  console.log('   - Orders, KOTs & Payments...');
  const customers = mockUsers.filter(u => u.role === 'customer');
  for (const branch of allBranches) {
    if (!branch) continue;
    const branchItems = await db.query.menuItems.findMany({
      where: (items, { eq }) => eq(items.tenantId, branch.tenantId),
      limit: 5
    });

    if (branchItems.length === 0) continue;

    for (let i = 0; i < 10; i++) {
      const customer = faker.helpers.arrayElement(customers);
      const subtotal = faker.number.int({ min: 200, max: 2000 });
      const [order] = await db.insert(schema.orders).values({
        tenantId: branch.tenantId,
        branchId: branch.id,
        customerId: customer.id,
        type: 'paid',
        status: faker.helpers.arrayElement(['pending', 'preparing', 'ready', 'delivered'] as const),
        subtotal: subtotal.toString(),
        total: subtotal.toString(),
        tableNumber: faker.number.int({ min: 1, max: 20 }).toString(),
      }).returning();

      if (!order) continue;

      const randomItem = faker.helpers.arrayElement(branchItems);
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        menuItemId: randomItem.id,
        name: randomItem.name,
        quantity: faker.number.int({ min: 1, max: 3 }),
        unitPrice: randomItem.price,
        total: (parseFloat(randomItem.price) * 2).toString(),
      });

      await db.insert(schema.kots).values({
        orderId: order.id,
        branchId: branch.id,
        status: order.status === 'delivered' ? 'completed' : 'preparing',
      });

      if (order.status === 'delivered' || faker.datatype.boolean()) {
        await db.insert(schema.payments).values({
          orderId: order.id,
          method: faker.helpers.arrayElement(['cash', 'upi', 'razorpay'] as const),
          amount: order.total,
          status: 'paid',
          paidAt: new Date(),
        });
      }
    }
  }

  // Mock Promotions & Ads
  console.log('   - Promotions & Ads...');
  for (const tenant of [...mockTenants, swamyTenant]) {
    if (!tenant) continue;
    await db.insert(schema.coupons).values({
      tenantId: tenant.id,
      code: faker.string.alphanumeric(6).toUpperCase(),
      discountType: 'PERCENTAGE',
      discountValue: '10.00',
      isActive: true,
    });

    await db.insert(schema.inAppAds).values({
      tenantId: tenant.id,
      title: 'Special Summer Offer',
      imageUrl: 'https://placehold.co/600x400',
      link: 'https://kwickly.com',
      isActive: true,
    });
  }

  console.log('✅ Seeding completed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:');
  console.error(err);
  process.exit(1);
});
