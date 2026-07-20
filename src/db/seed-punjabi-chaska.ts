import { db } from './index.ts';
import * as schema from './schema/index.ts';
import { eq } from 'drizzle-orm';

async function main() {
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
        enabledModules: {
          dineIn: true,
          takeaway: true,
          delivery: true,
          subscriptions: true,
        },
      },
    });

  console.log('✅ Tenant & Branding structured.');

  // Clean old menu categories for a clean reload if they exist
  const existingCats = await db
    .select()
    .from(schema.menuCategories)
    .where(eq(schema.menuCategories.tenantId, tenant.id));

  for (const cat of existingCats) {
    // Delete items variants first
    const items = await db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.categoryId, cat.id));
    for (const item of items) {
      await db.delete(schema.menuItemVariants).where(eq(schema.menuItemVariants.menuItemId, item.id));
      await db.delete(schema.menuItemAddons).where(eq(schema.menuItemAddons.menuItemId, item.id));
      await db.delete(schema.menuItems).where(eq(schema.menuItems.id, item.id));
    }
    await db.delete(schema.menuCategories).where(eq(schema.menuCategories.id, cat.id));
  }

  console.log('🧹 Old menu cleared for clean reload.');

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

export async function seedPunjabiChaska() {
  await main();
}

if (import.meta.main) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
