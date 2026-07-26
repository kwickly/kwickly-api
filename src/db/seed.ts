import { db } from './index.ts';
import * as schema from './schema/index.ts';
import { faker } from '@faker-js/faker';
import { eq, sql } from 'drizzle-orm';

async function main() {
  console.log('🧹 Wiping existing database data...');
  await db.execute(sql`
    TRUNCATE TABLE 
      payments, otp_codes, sessions, tenant_billing_meters, support_tickets, ticket_messages,
      staff_profiles, staff_attendance, staff_leaves, public_holidays, coupons, predefined_discounts,
      branches, users, password_reset_tokens, combos, combo_items, customer_profiles, wallet_transactions,
      loyalty_ledgers, attendance_logs, table_sessions, orders, order_items, in_app_ads, ad_impressions,
      roles, permissions, role_permissions, subscription_plans, customer_subscriptions, audit_logs,
      payroll_runs, salary_slips, restaurant_tables, timesheets, kots, devices, menu_categories,
      menu_items, menu_item_variants, menu_item_addons, tenants, tenant_brandings,
      notification_templates, notification_logs, fcm_tokens, suppliers, raw_materials, recipes
    RESTART IDENTITY CASCADE;
  `);

  console.log('🌱 Starting comprehensive database seeding...');

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
      timezone: 'Asia/Kolkata',
      openingHours: {
        mon: { open: "09:00", close: "22:00" },
        tue: { open: "09:00", close: "22:00" },
        wed: { open: "09:00", close: "22:00" },
        thu: { open: "09:00", close: "22:00" },
        fri: { open: "09:00", close: "22:00" },
        sat: { open: "09:00", close: "23:00" },
        sun: { open: "09:00", close: "23:00" }
      }
    },
  ]).onConflictDoUpdate({
    target: [schema.branches.tenantId, schema.branches.name],
    set: { 
      address: 'Vashi, Navi Mumbai', 
      phone: '9876543210',
      timezone: 'Asia/Kolkata',
      openingHours: {
        mon: { open: "09:00", close: "22:00" },
        tue: { open: "09:00", close: "22:00" },
        wed: { open: "09:00", close: "22:00" },
        thu: { open: "09:00", close: "22:00" },
        fri: { open: "09:00", close: "22:00" },
        sat: { open: "09:00", close: "23:00" },
        sun: { open: "09:00", close: "23:00" }
      }
    }
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
    // Tables
    { name: 'Manage Tables', slug: 'tables:manage', description: 'Can add, edit, or delete physical tables' },
    // Attendance & Payroll
    { name: 'Manage Attendance', slug: 'attendance:manage', description: 'Can view and edit staff attendance' },
    { name: 'View Payroll', slug: 'payroll:view', description: 'Can view payroll history and slips' },
    { name: 'Manage Payroll', slug: 'payroll:manage', description: 'Can process payroll and salary slips' },
    // CRM & Promotions
    { name: 'Manage CRM', slug: 'crm:manage', description: 'Can view and manage customer data' },
    { name: 'Manage Promotions', slug: 'promotions:manage', description: 'Can create coupons and ads' },
    { name: 'Manage Wallet', slug: 'wallet:manage', description: 'Can credit/debit customer wallets' },
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
    ['menu:read', 'menu:write', 'orders:read', 'orders:write', 'staff:read', 'analytics:read', 'inventory:read', 'inventory:write', 'billing:manage', 'payroll:manage', 'payroll:view', 'attendance:manage', 'tables:manage'].includes(p.slug)
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
      posPin: await Bun.password.hash('1234'), // Hashed 1234 PIN
      role: 'staff' as const,
      roleId: seededRoles['manager'].id,
    }
  ];

  for (const user of stableUsers) {
    await db.insert(schema.users).values(user).onConflictDoUpdate({
      target: schema.users.email,
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
        timezone: 'Asia/Kolkata',
        openingHours: {
          mon: { open: "09:00", close: "22:00" },
          tue: { open: "09:00", close: "22:00" },
          wed: { open: "09:00", close: "22:00" },
          thu: { open: "09:00", close: "22:00" },
          fri: { open: "09:00", close: "22:00" },
          sat: { open: "09:00", close: "23:00" },
          sun: { open: "09:00", close: "23:00" }
        }
      }))
    ).onConflictDoNothing().returning();
    mockBranches.push(...branches);
  }

  // Mock Users (Staff & Customers & Platform Admins)
  console.log('   - Staff, Customers & Platform Admins...');
  const allBranches = [...mockBranches, swamyMainBranch];
  
  // Seed randomized super_admins and platform_owners
  const platformAdminUsers = await db.insert(schema.users).values(
    Array.from({ length: 5 }).map(() => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      password: mockPassword,
      role: faker.helpers.arrayElement(['super_admin', 'platform_owner'] as const),
    }))
  ).returning();

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

    // Mock Suppliers
    await db.insert(schema.suppliers).values(
      Array.from({ length: 3 }).map(() => ({
        tenantId: tenant.id,
        name: faker.company.name() + ' Suppliers',
        contactPerson: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        gstNumber: faker.string.alphanumeric(15).toUpperCase(),
      }))
    ).onConflictDoNothing();
  }

  // Mock CRM Profiles and Wallet
  console.log('   - CRM Profiles & Wallets...');
  const customers = mockUsers.filter(u => u.role === 'customer');
  for (const customer of customers) {
    if (!customer.tenantId) continue;
    
    // Create Profile with Wallet Balance
    await db.insert(schema.customerProfiles).values({
      tenantId: customer.tenantId,
      userId: customer.id,
      marketingOptIn: faker.datatype.boolean(),
      walletBalance: faker.number.float({ min: 50, max: 1000 }).toFixed(2),
    }).onConflictDoNothing();

    // Create Initial Wallet Transaction (Top-up)
    await db.insert(schema.walletTransactions).values({
      tenantId: customer.tenantId,
      userId: customer.id,
      amount: faker.number.float({ min: 50, max: 1000 }).toFixed(2),
      type: 'CREDIT',
      reason: 'Initial Promo Top-up',
    });
  }

  // Mock Orders, KOTs & Payments
  console.log('   - Orders, KOTs & Payments...');
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
      status: 'ACTIVE',
    });

    await db.insert(schema.inAppAds).values({
      tenantId: tenant.id,
      title: 'Special Summer Offer',
      imageUrl: 'https://placehold.co/600x400',
      link: 'https://kwickly.com',
      status: 'ACTIVE',
    });
  }

  // Mock Timesheets
  console.log('   - Timesheets...');
  const allStaff = [...platformAdminUsers, ...mockUsers.filter(u => u.role === 'staff')];
  for (const staff of allStaff) {
    if (faker.datatype.boolean()) {
      const clockIn = faker.date.recent({ days: 7 });
      const status = faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED'] as const);
      let clockOut = null;
      let totalHours = null;
      let reviewerNotes = null;
      let reviewedBy = null;

      if (status !== 'PENDING') {
        const hours = faker.number.int({ min: 4, max: 9 });
        clockOut = new Date(clockIn.getTime() + hours * 60 * 60 * 1000);
        totalHours = hours.toString();
        const firstAdmin = platformAdminUsers[0];
        if (firstAdmin) {
          reviewedBy = firstAdmin.id; // first platform admin
        }
        
        if (status === 'REJECTED') {
          reviewerNotes = faker.helpers.arrayElement(['Missing lunch break', 'Clocked out late without approval', 'Incorrect hours logged']);
        } else if (faker.datatype.boolean()) {
          reviewerNotes = faker.helpers.arrayElement(['Approved with adjusted overtime', 'Note: arrived late']);
        }
      }

      await db.insert(schema.timesheets).values({
        staffId: staff.id,
        tenantId: staff.tenantId,
        branchId: staff.branchId,
        clockIn,
        clockOut,
        totalHours,
        status,
        reviewedBy,
        reviewerNotes,
        reviewedAt: status !== 'PENDING' ? faker.date.recent({ days: 1 }) : null,
      });
    }
  }

  // Mock Leaves & Holidays
  console.log('   - Leaves & Holidays...');
  for (const tenant of [...mockTenants, swamyTenant]) {
    if (!tenant) continue;
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const endOfMonth = new Date(startOfMonth.getTime());
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);

    const holidayDate = new Date(startOfMonth.getTime() + 5 * 86400000); // 5th of month

    await db.insert(schema.publicHolidays).values({
      tenantId: tenant.id,
      name: 'Sample Public Holiday',
      date: holidayDate.toISOString().slice(0, 10)
    }).onConflictDoNothing();

    const tenantStaff = allStaff.filter(s => s.tenantId === tenant.id);
    const firstStaff = tenantStaff[0];
    if (firstStaff) {
      const leaveStart = new Date(startOfMonth.getTime() + 10 * 86400000); // 10th
      const leaveEnd = new Date(startOfMonth.getTime() + 12 * 86400000); // 12th
      
      await db.insert(schema.staffLeaves).values({
        tenantId: tenant.id,
        staffId: firstStaff.id,
        leaveType: 'UNPAID',
        startDate: leaveStart.toISOString().slice(0, 10),
        endDate: leaveEnd.toISOString().slice(0, 10),
        status: 'APPROVED'
      });
    }
  }

  // Mock Payroll Runs
  console.log('   - Payroll & Salary Slips...');
  for (const tenant of [...mockTenants, swamyTenant]) {
    if (!tenant) continue;
    
    // Create a draft payroll run for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const endOfMonth = new Date(startOfMonth.getTime());
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);

    const [run] = await db.insert(schema.payrollRuns).values({
      tenantId: tenant.id,
      periodStartDate: startOfMonth.toISOString().slice(0, 10),
      periodEndDate: endOfMonth.toISOString().slice(0, 10),
      status: 'DRAFT',
    }).onConflictDoUpdate({
      target: [schema.payrollRuns.tenantId, schema.payrollRuns.periodStartDate, schema.payrollRuns.periodEndDate],
      set: { status: 'DRAFT' }
    }).returning();

    if (run) {
      const tenantStaff = allStaff.filter(s => s.tenantId === tenant.id);
      for (const staff of tenantStaff) {
        const base = faker.number.float({ min: 1000, max: 5000 });
        const ot = faker.number.float({ min: 0, max: 500 });
        const bonus = faker.datatype.boolean() ? faker.number.float({ min: 100, max: 300 }) : 0;
        const net = base + ot + bonus;

        await db.insert(schema.salarySlips).values({
          tenantId: tenant.id,
          payrollRunId: run.id,
          staffId: staff.id,
          baseAmount: base.toFixed(2),
          overtimeAmount: ot.toFixed(2),
          bonus: bonus.toFixed(2),
          deductions: '0.00',
          netPayable: net.toFixed(2),
          status: 'DRAFT'
        }).onConflictDoUpdate({
          target: [schema.salarySlips.payrollRunId, schema.salarySlips.staffId],
          set: {
            baseAmount: base.toFixed(2),
            overtimeAmount: ot.toFixed(2),
            bonus: bonus.toFixed(2),
            netPayable: net.toFixed(2)
          }
        });
      }
    }
  }

  console.log('✅ Base seeding completed successfully!');
  await seedPunjabiChaskaLocal();
  console.log('🎉 All seed scripts completed!');
  process.exit(0);
}

async function seedPunjabiChaskaLocal() {
  console.log('🌱 Onboarding tenant: Punjabi Chaska...');

  // 1. Create or update tenant
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: 'Punjabi Chaska',
      slug: 'punjabi-chaska',
      email: 'contact@punjabichaska.com',
      phone: '9999888877',
      address: 'Sector 17, Vashi, Navi Mumbai',
      baseCurrency: 'INR',
      plan: 'GROWTH',
      billingModel: 'FLAT',
      baseFee: '3499.00',
      maxOrdersPerMonth: 2000,
    })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: {
        name: 'Punjabi Chaska',
        email: 'contact@punjabichaska.com',
        phone: '9999888877',
        address: 'Sector 17, Vashi, Navi Mumbai',
        baseCurrency: 'INR',
        plan: 'GROWTH',
        billingModel: 'FLAT',
        baseFee: '3499.00',
        maxOrdersPerMonth: 2000,
      },
    })
    .returning();

  if (!tenant) throw new Error('Failed to create/update tenant Punjabi Chaska');

  // 2. Create default branch
  const [branch] = await db
    .insert(schema.branches)
    .values({
      tenantId: tenant.id,
      name: 'Main Branch (Vashi)',
      address: 'Sector 17, Vashi, Navi Mumbai',
      phone: '9999888877',
    })
    .onConflictDoUpdate({
      target: [schema.branches.tenantId, schema.branches.name],
      set: {
        address: 'Sector 17, Vashi, Navi Mumbai',
        phone: '9999888877',
      },
    })
    .returning();

  if (!branch) throw new Error('Failed to create/update default branch');

  // 3. Create tenant branding
  await db
    .insert(schema.tenantBrandings)
    .values({
      tenantId: tenant.id,
      brandColor: '#eab308', // Amber/Yellow
      logoUrl: '/logo.png',
      themeMode: 'light',
      enabledModules: {
        dineIn: true,
        takeaway: true,
        delivery: true,
        subscriptions: true,
      },
    })
    .onConflictDoUpdate({
      target: schema.tenantBrandings.tenantId,
      set: {
        brandColor: '#eab308',
        logoUrl: '/logo.png',
        enabledModules: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          subscriptions: true,
        },
      },
    });

  console.log('✅ Tenant & Branding structured.');

  // 4. Create Restaurant Tables
  await db
    .insert(schema.restaurantTables)
    .values([
      { branchId: branch.id, name: 'Table 1', capacity: 4, qrToken: 'pc-t1', sortOrder: 1 },
      { branchId: branch.id, name: 'Table 2', capacity: 4, qrToken: 'pc-t2', sortOrder: 2 },
      { branchId: branch.id, name: 'Table 3', capacity: 2, qrToken: 'pc-t3', sortOrder: 3 },
      { branchId: branch.id, name: 'Table 4', capacity: 6, qrToken: 'pc-t4', sortOrder: 4 },
      { branchId: branch.id, name: 'Table 5', capacity: 8, qrToken: 'pc-t5', sortOrder: 5 },
      { branchId: branch.id, name: 'Table 6', capacity: 4, qrToken: 'pc-t6', sortOrder: 6 },
    ])
    .onConflictDoNothing();

  console.log('✅ Restaurant Tables structured.');

  // Helper to add category and items
  const addCategoryWithItems = async (
    categoryName: string,
    items: {
      name: string;
      price: number;
      description?: string;
      calories?: number;
      servingSize?: string;
      ingredients?: string[];
      allergens?: string[];
      isBestseller?: boolean;
      isChefSpecial?: boolean;
      isNew?: boolean;
      isPopular?: boolean;
      isHealthyChoice?: boolean;
      isLimitedEdition?: boolean;
      protein?: number;
      carbs?: number;
      fat?: number;
      variants?: { name: string; priceDelta: number }[];
      addons?: { name: string; price: number }[];
    }[]
  ) => {
    const [cat] = await db
      .insert(schema.menuCategories)
      .values({
        tenantId: tenant.id,
        name: categoryName,
      })
      .returning();

    if (!cat) throw new Error(`Failed to insert category ${categoryName}`);

    for (const item of items) {
      const [menuItem] = await db
        .insert(schema.menuItems)
        .values({
          tenantId: tenant.id,
          categoryId: cat.id,
          name: item.name,
          price: item.price.toFixed(2),
          description: item.description,
          isVeg: true,
          calories: item.calories,
          servingSize: item.servingSize,
          ingredients: item.ingredients || null,
          allergens: item.allergens || null,
          isBestseller: item.isBestseller ?? false,
          isChefSpecial: item.isChefSpecial ?? false,
          isNew: item.isNew ?? false,
          isPopular: item.isPopular ?? false,
          isHealthyChoice: item.isHealthyChoice ?? false,
          isLimitedEdition: item.isLimitedEdition ?? false,
          protein: item.protein ? item.protein.toFixed(1) : null,
          carbs: item.carbs ? item.carbs.toFixed(1) : null,
          fat: item.fat ? item.fat.toFixed(1) : null,
        })
        .returning();

      if (!menuItem) throw new Error(`Failed to insert menu item ${item.name}`);

      if (item.variants) {
        for (const variant of item.variants) {
          await db.insert(schema.menuItemVariants).values({
            menuItemId: menuItem.id,
            name: variant.name,
            priceDelta: variant.priceDelta.toFixed(2),
          });
        }
      }

      if (item.addons) {
        for (const addon of item.addons) {
          await db.insert(schema.menuItemAddons).values({
            tenantId: tenant.id,
            menuItemId: menuItem.id,
            name: addon.name,
            price: addon.price.toFixed(2),
          });
        }
      }
    }
    console.log(`🍟 Seeded category: ${categoryName} with ${items.length} items.`);
  };

  // 🥤 Beverages
  await addCategoryWithItems('🥤 Beverages', [
    { name: 'Special Lassi', price: 50, isBestseller: true, isPopular: true, calories: 210, servingSize: '1 glass (300ml)', protein: 8.5, carbs: 22, fat: 12, ingredients: ['Yogurt', 'Sugar', 'Cardamom', 'Cream'], allergens: ['Dairy'], addons: [{ name: 'Extra Malai', price: 15 }, { name: 'Roohafza Flavor', price: 10 }] },
    { name: 'Plain Lassi', price: 40, calories: 180, servingSize: '1 glass (300ml)', protein: 8, carbs: 18, fat: 10, ingredients: ['Yogurt', 'Sugar'], allergens: ['Dairy'] },
    { name: 'Masala Chaas', price: 40, isHealthyChoice: true, calories: 60, servingSize: '1 glass (300ml)', protein: 3, carbs: 5, fat: 2, ingredients: ['Yogurt', 'Water', 'Cumin', 'Mint', 'Black Salt'], allergens: ['Dairy'] },
    { name: 'Shikanji', price: 40, isHealthyChoice: true, calories: 80, servingSize: '1 glass (300ml)', ingredients: ['Lemon', 'Water', 'Sugar', 'Mint'] },
  ]);

  // 🍽 Fast Food
  await addCategoryWithItems('🍽 Fast Food', [
    { name: 'Chole Bhature', price: 130, isBestseller: true, calories: 520, servingSize: '2 bhature + 1 bowl chole', protein: 12, carbs: 65, fat: 22, ingredients: ['Chickpeas', 'Flour', 'Tomato', 'Onion', 'Ghee', 'Spices'], allergens: ['Gluten', 'Dairy'], addons: [{ name: 'Extra Bhatura', price: 30 }, { name: 'Extra Chole', price: 40 }, { name: 'Onion Salad', price: 10 }] },
    { name: 'Puri Aloo', price: 110, isPopular: true, calories: 480, servingSize: '4 puri + 1 bowl aloo', ingredients: ['Wheat', 'Potato', 'Tomato', 'Spices'], allergens: ['Gluten'], addons: [{ name: 'Extra Puri', price: 15 }] },
    { name: 'Kulche Chole', price: 120, calories: 450, servingSize: '2 kulche + 1 bowl chole', ingredients: ['Chickpeas', 'Flour', 'Yeast', 'Spices'], allergens: ['Gluten'] },
    { name: 'Tandoori Kulche Chole', price: 140, isChefSpecial: true, isLimitedEdition: true, calories: 490, servingSize: '2 kulche + 1 bowl chole', protein: 14, carbs: 60, fat: 18, ingredients: ['Chickpeas', 'Flour', 'Butter', 'Spices'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Aloo Tikki Chole', price: 90, isPopular: true, calories: 350, servingSize: '2 tikki + chole', ingredients: ['Potato', 'Chickpeas', 'Tamarind', 'Mint', 'Spices'] },
    { name: 'Pav Bhaji', price: 100, isPopular: true, calories: 420, servingSize: '2 pav + 1 bowl bhaji', ingredients: ['Mixed Vegetables', 'Potato', 'Bread', 'Butter', 'Spices'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Veg Grill Sandwich', price: 90, isNew: true, calories: 280, servingSize: '1 sandwich', ingredients: ['Bread', 'Cucumber', 'Tomato', 'Onion', 'Mint Chutney'], allergens: ['Gluten'] },
    { name: 'Veg Cheese Grill Sandwich', price: 100, calories: 350, servingSize: '1 sandwich', ingredients: ['Bread', 'Cheese', 'Cucumber', 'Tomato', 'Mint Chutney'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Veg Roll', price: 70, calories: 310, servingSize: '1 roll', ingredients: ['Flour', 'Cabbage', 'Carrot', 'Capsicum', 'Sauces'], allergens: ['Gluten'] },
    { name: 'Vada Pav', price: 55, isPopular: true, calories: 290, servingSize: '1 pav', ingredients: ['Potato', 'Besan', 'Bread', 'Garlic Chutney'], allergens: ['Gluten'] },
    { name: 'Maska Pav', price: 70, calories: 220, servingSize: '2 pav', ingredients: ['Bread', 'Butter'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Paneer Pakoda', price: 80, calories: 380, servingSize: '200g', ingredients: ['Paneer', 'Besan', 'Spices'], allergens: ['Dairy'] },
    { name: 'Veg Paneer Roll', price: 90, calories: 420, servingSize: '1 roll', ingredients: ['Flour', 'Paneer', 'Vegetables', 'Sauces'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Veg Cheese Roll', price: 90, calories: 450, servingSize: '1 roll', ingredients: ['Flour', 'Cheese', 'Vegetables', 'Sauces'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Paneer Kurkure', price: 110, isNew: true, calories: 410, servingSize: '200g', ingredients: ['Paneer', 'Cornflakes', 'Spices'], allergens: ['Dairy', 'Gluten'] },
    { name: 'Cheese Kurkure', price: 120, calories: 460, servingSize: '200g', ingredients: ['Cheese', 'Cornflakes', 'Spices'], allergens: ['Dairy', 'Gluten'] },
  ]);

  // 🍛 Meals / Plate Combos
  await addCategoryWithItems('🍛 Meals / Plate Combos', [
    { name: 'Paneer Butter Masala + 2 Tava Roti', price: 140 },
    { name: 'Paneer Butter Masala + 2 Chapati', price: 150 },
    { name: 'Dal Makhani + 2 Tava Roti', price: 109 },
    { name: 'Mix Veg + 2 Tava Roti', price: 109 },
    { name: 'Malai Chaap + 2 Tava Roti', price: 160 },
    { name: 'Tandoori Chaap + 2 Tava Roti', price: 160 },
    { name: 'Amritsari Chole + 2 Tava Roti', price: 109 },
  ]);

  // 🍱 Combo Meals
  await addCategoryWithItems('🍱 Combo Meals', [
    { name: 'Combo 1', price: 150, description: 'Dal Tadka, Mix Veg, 2 Tava Roti, Jeera Rice, Raita, Sweet Dish', isPopular: true, calories: 850, servingSize: '1 meal', ingredients: ['Lentils', 'Mixed Veg', 'Wheat', 'Rice', 'Yogurt', 'Sugar'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Combo 2', price: 180, description: 'Dal Makhani, Shahi Paneer, 2 Tava Roti, Jeera Rice, Raita, Sweet Dish', isBestseller: true, calories: 1100, servingSize: '1 meal', ingredients: ['Black Lentils', 'Paneer', 'Wheat', 'Rice', 'Yogurt', 'Cream', 'Butter'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Chole Bhature + Lassi', price: 160, isPopular: true, calories: 730, servingSize: '1 meal', ingredients: ['Chickpeas', 'Flour', 'Yogurt'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Paneer Butter Masala + 2 Butter Naan', price: 200, isChefSpecial: true, calories: 920, servingSize: '1 meal', ingredients: ['Paneer', 'Tomato', 'Butter', 'Flour'], allergens: ['Gluten', 'Dairy'] },
    { name: 'Shahi Paneer + 2 Laccha Paratha', price: 200, calories: 950, servingSize: '1 meal', ingredients: ['Paneer', 'Cream', 'Wheat', 'Butter'], allergens: ['Gluten', 'Dairy'] },
  ]);

  // 🍛 Rice Combos
  await addCategoryWithItems('🍛 Rice Combos', [
    { name: 'Rajma Chawal', price: 109, isBestseller: true, calories: 520, servingSize: '1 plate', ingredients: ['Kidney Beans', 'Rice', 'Tomato', 'Onion', 'Spices'] },
    { name: 'Kadhi Chawal', price: 109, isPopular: true, calories: 480, servingSize: '1 plate', ingredients: ['Yogurt', 'Besan', 'Rice', 'Spices'], allergens: ['Dairy'] },
    { name: 'Dal Chawal', price: 109, isHealthyChoice: true, calories: 410, servingSize: '1 plate', ingredients: ['Yellow Lentils', 'Rice', 'Spices'] },
    { name: 'Chole Chawal', price: 109, calories: 500, servingSize: '1 plate', ingredients: ['Chickpeas', 'Rice', 'Tomato', 'Spices'] },
  ]);

  // 🥘 North Indian Curries (250 ml)
  await addCategoryWithItems('🥘 North Indian Curries (250 ml)', [
    { name: 'Shahi Paneer', price: 160, isBestseller: true, calories: 450, servingSize: '250ml', ingredients: ['Paneer', 'Cream', 'Tomato', 'Cashew Paste'], allergens: ['Dairy', 'Nuts'] },
    { name: 'Paneer Butter Masala', price: 160, isChefSpecial: true, calories: 480, servingSize: '250ml', ingredients: ['Paneer', 'Butter', 'Tomato', 'Onion', 'Spices'], allergens: ['Dairy'] },
    { name: 'Kadai Paneer', price: 180, isPopular: true, calories: 420, servingSize: '250ml', ingredients: ['Paneer', 'Capsicum', 'Onion', 'Tomato', 'Kadai Masala'], allergens: ['Dairy'] },
    { name: 'Palak Paneer', price: 170, isHealthyChoice: true, calories: 350, servingSize: '250ml', ingredients: ['Spinach', 'Paneer', 'Garlic', 'Spices'], allergens: ['Dairy'] },
    { name: 'Palak Corn', price: 170, calories: 320, servingSize: '250ml', ingredients: ['Spinach', 'Sweet Corn', 'Garlic', 'Spices'], allergens: ['Dairy'] },
    { name: 'Kashmiri Dum Aloo', price: 190, calories: 380, servingSize: '250ml', ingredients: ['Baby Potato', 'Yogurt', 'Fennel', 'Ginger Powder'], allergens: ['Dairy'] },
    { name: 'Malai Paneer', price: 190, calories: 510, servingSize: '250ml', ingredients: ['Paneer', 'Cream', 'Spices'], allergens: ['Dairy'] },
    { name: 'Malai Kofta', price: 200, isChefSpecial: true, calories: 550, servingSize: '250ml', ingredients: ['Paneer', 'Potato', 'Cream', 'Cashew Paste'], allergens: ['Dairy', 'Nuts'] },
    { name: 'Veg Kofta', price: 170, calories: 410, servingSize: '250ml', ingredients: ['Mixed Veg', 'Besan', 'Tomato Gravy'] },
    { name: 'Methi Malai Mutter', price: 190, calories: 480, servingSize: '250ml', ingredients: ['Fenugreek Leaves', 'Green Peas', 'Cream'], allergens: ['Dairy'] },
    { name: 'Mutter Paneer', price: 170, calories: 420, servingSize: '250ml', ingredients: ['Green Peas', 'Paneer', 'Tomato Gravy'], allergens: ['Dairy'] },
    { name: 'Aloo Mutter', price: 150, calories: 310, servingSize: '250ml', ingredients: ['Potato', 'Green Peas', 'Tomato Gravy'] },
    { name: 'Kaju Masala', price: 230, calories: 580, servingSize: '250ml', ingredients: ['Cashews', 'Tomato', 'Onion', 'Spices'], allergens: ['Nuts'] },
    { name: 'Kaju Paneer', price: 190, calories: 520, servingSize: '250ml', ingredients: ['Cashews', 'Paneer', 'Tomato Gravy'], allergens: ['Dairy', 'Nuts'] },
    { name: 'Paneer Keema', price: 210, isNew: true, calories: 460, servingSize: '250ml', ingredients: ['Minced Paneer', 'Onion', 'Tomato', 'Spices'], allergens: ['Dairy'] },
    { name: 'Punjabi Rajma', price: 130, isPopular: true, calories: 340, servingSize: '250ml', ingredients: ['Kidney Beans', 'Onion', 'Tomato', 'Spices'] },
    { name: 'Punjabi Kadhi', price: 130, calories: 310, servingSize: '250ml', ingredients: ['Yogurt', 'Besan', 'Spices'], allergens: ['Dairy'] },
    { name: 'Amritsari Chole', price: 130, calories: 380, servingSize: '250ml', ingredients: ['Chickpeas', 'Onion', 'Tomato', 'Amritsari Spices'] },
    { name: 'Dal Makhani', price: 130, isBestseller: true, calories: 450, servingSize: '250ml', ingredients: ['Black Lentils', 'Kidney Beans', 'Butter', 'Cream'], allergens: ['Dairy'] },
    { name: 'Dal Tadka', price: 120, isHealthyChoice: true, calories: 280, servingSize: '250ml', ingredients: ['Yellow Lentils', 'Garlic', 'Cumin', 'Ghee'], allergens: ['Dairy'] },
    { name: 'Mushroom Butter Masala', price: 180, calories: 390, servingSize: '250ml', ingredients: ['Mushroom', 'Butter', 'Tomato', 'Spices'], allergens: ['Dairy'] },
  ]);

  // 🥗 Raita
  await addCategoryWithItems('🥗 Raita', [
    { name: 'Boondi Raita', price: 40 },
    { name: 'Mix Raita', price: 50 },
    { name: 'Plain Curd', price: 30 },
  ]);

  // 🫓 Mix Parathas
  await addCategoryWithItems('🫓 Mix Parathas', [
    { name: 'Aloo Onion', price: 95 },
    { name: 'Aloo Gobi', price: 95 },
    { name: 'Aloo Paneer', price: 115 },
    { name: 'Aloo Methi', price: 95 },
    { name: 'Aloo Cheese', price: 120 },
    { name: 'Gobi Onion', price: 95 },
    { name: 'Gobi Methi', price: 95 },
    { name: 'Gobi Cheese', price: 120 },
    { name: 'Paneer Onion', price: 110 },
    { name: 'Paneer Cheese', price: 120 },
    { name: 'Paneer Methi', price: 110 },
    { name: 'Onion Methi', price: 95 },
    { name: 'Onion Cheese', price: 120 },
    { name: 'Methi Cheese', price: 110 },
    { name: 'All Mix', price: 130 },
  ]);

  // 🍚 Rice
  await addCategoryWithItems('🍚 Rice', [
    { name: 'Plain Rice', price: 80 },
    { name: 'Jeera Rice', price: 95 },
    { name: 'Butter Jeera Rice', price: 115 },
    { name: 'Mutter Pulao', price: 130 },
    { 
      name: 'Veg Pulao', 
      price: 90, 
      variants: [
        { name: 'Small', priceDelta: 0 },
        { name: 'Full', priceDelta: 60 }
      ] 
    },
  ]);

  // 🥟 Indian Starters
  await addCategoryWithItems('🥟 Indian Starters', [
    { name: 'Crispy Corn', price: 220 },
    { 
      name: 'Crispy Paneer Stick', 
      price: 140, 
      variants: [
        { name: 'Half', priceDelta: 0 },
        { name: 'Full', priceDelta: 80 }
      ] 
    },
    { 
      name: 'Crispy Cheese Stick', 
      price: 140, 
      variants: [
        { name: 'Half', priceDelta: 0 },
        { name: 'Full', priceDelta: 80 }
      ] 
    },
    { name: 'Shami Kebab', price: 220 },
    { 
      name: 'Malai Paneer Tikka', 
      price: 170, 
      variants: [
        { name: 'Half', priceDelta: 0 },
        { name: 'Full', priceDelta: 80 }
      ] 
    },
    { 
      name: 'Tandoori Paneer Tikka', 
      price: 170, 
      variants: [
        { name: 'Half', priceDelta: 0 },
        { name: 'Full', priceDelta: 80 }
      ] 
    },
    { 
      name: 'Malai Chaap Tikka', 
      price: 170, 
      variants: [
        { name: 'Half', priceDelta: 0 },
        { name: 'Full', priceDelta: 60 }
      ] 
    },
    { 
      name: 'Tandoori Chaap Tikka', 
      price: 170, 
      variants: [
        { name: 'Half', priceDelta: 0 },
        { name: 'Full', priceDelta: 60 }
      ] 
    },
    { 
      name: 'Capsicum Spicy Paneer', 
      price: 180, 
      variants: [
        { name: 'Half', priceDelta: 0 },
        { name: 'Full', priceDelta: 70 }
      ] 
    },
    { 
      name: 'Honey Chilli Potato', 
      price: 170, 
      variants: [
        { name: 'Half', priceDelta: 0 },
        { name: 'Full', priceDelta: 50 }
      ] 
    },
  ]);

  // 🥬 Dry Curries (250 ml)
  await addCategoryWithItems('🥬 Dry Curries (250 ml)', [
    { name: 'Paneer Bhurji', price: 210 },
    { name: 'Gobi Mutter Aloo', price: 150 },
    { name: 'Baigan Bharta', price: 150 },
    { name: 'Aloo Methi', price: 120 },
    { name: 'Aloo Jeera', price: 120 },
    { name: 'Mix Veg', price: 130 },
    { name: 'Achari Bhindi', price: 130 },
  ]);

  // 🫓 Roti & Naan
  await addCategoryWithItems('🫓 Roti & Naan', [
    { name: 'Tava Roti', price: 14 },
    { name: 'Tava Butter Roti', price: 17 },
    { name: 'Tandoori Roti', price: 22 },
    { name: 'Tandoori Butter Roti', price: 27 },
    { name: 'Plain Naan', price: 35 },
    { name: 'Butter Naan', price: 40 },
    { name: 'Garlic Naan', price: 45 },
    { name: 'Aloo Kulcha', price: 90 },
    { name: 'Paneer Kulcha', price: 120 },
  ]);

  // 🫓 Parathas
  await addCategoryWithItems('🫓 Parathas', [
    { name: 'Plain Paratha', price: 30 },
    { name: 'Laccha Paratha', price: 40 },
    { name: 'Aloo Paratha', price: 85 },
    { name: 'Gobi Paratha', price: 85 },
    { name: 'Onion Paratha', price: 85 },
    { name: 'Paneer Paratha', price: 105 },
    { name: 'Methi Paratha', price: 70 },
    { name: 'Cheese Paratha', price: 100 },
  ]);

  // 🍮 Desserts
  await addCategoryWithItems('🍮 Desserts', [
    { name: 'Rabdi Gulab Jamun', price: 80 },
    { name: 'Amritsari Rasmalai', price: 80 },
    { name: 'Shahi Toast', price: 80 },
  ]);

  console.log('🎉 Punjabi Chaska successfully onboarded & seeded!');
}

main().catch((err) => {
  console.error('❌ Seeding failed:');
  console.error(err);
  process.exit(1);
});
