import {
  PrismaClient,
  UserRole,
  SubscriptionStatus,
  SubscriptionPlan,
} from "@prisma/client";
import { hash } from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Generate secure random password
function generateSecurePassword(length: number = 20): string {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
}

async function main() {
  console.log("🌱 Starting seed...");

  // Generate random passwords for security
  const superuserPlainPassword = "superuser123"; //generateSecurePassword();
  const userPlainPassword = "user123"; //generateSecurePassword();
  const adminPlainPassword = "admin123"; //generateSecurePassword();

  // Create superuser
  const superuserPassword = await hash(superuserPlainPassword, 12);
  const superuser = await prisma.user.upsert({
    where: { email: "superuser@example.com" },
    update: {},
    create: {
      email: "superuser@example.com",
      name: "Super User",
      password: superuserPassword,
      role: UserRole.SUPERUSER,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
    },
  });

  // Create normal user with trial
  const userPassword = await hash(userPlainPassword, 12);
  const now = new Date();
  const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Normal User",
      password: userPassword,
      role: UserRole.USER,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      trialStartDate: now,
      trialEndDate: trialEndDate,
    },
  });

  // Create admin user
  const adminPassword = await hash(adminPlainPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: UserRole.ADMIN,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionPlan: SubscriptionPlan.BUSINESS,
    },
  });

  // Create snippet categories
  const categories = [
    { name: "all", label: "All", order: 0 },
    { name: "Lead Generation", label: "Lead Generation", order: 1 },
    { name: "Customer Support", label: "Customer Support", order: 2 },
    { name: "Sales and Marketing", label: "Sales and Marketing", order: 3 },
    {
      name: "Information & Navigation",
      label: "Information & Navigation",
      order: 4,
    },
    { name: "E-Commerce", label: "E-Commerce", order: 5 },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.snippetCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    createdCategories.push(created);
  }

  // Create snippet examples
  const snippets = [
    {
      categoryName: "Lead Generation",
      title: "Greet Visitor",
      text: "Greet the visitor and ask them what brings them to the website. If they mention interest in products or services, ask follow-up questions to understand their needs better, then recommend products or services based on their needs.",
      order: 1,
    },
    {
      categoryName: "Lead Generation",
      title: "Contact Details",
      text: "If the visitor shows interest in learning more, politely ask for their contact details so you can provide them with more information.",
      order: 2,
    },
    {
      categoryName: "Customer Support",
      title: "Support Query",
      text: "In case the customer has a support query, encourage them to describe the issue with more details and the actions they have taken so far.",
      order: 1,
    },
    {
      categoryName: "Customer Support",
      title: "Troubleshooting",
      text: "Ask the visitor to describe the issue they are facing. Provide step-by-step troubleshooting instructions based on common problems.",
      order: 2,
    },
    {
      categoryName: "Customer Support",
      title: "Product Information",
      text: "When asked about specific products or services, provide detailed information including features, benefits, and pricing options.",
      order: 3,
    },
    {
      categoryName: "Sales and Marketing",
      title: "Sales Pitch",
      text: "For potential customers, highlight the key benefits and unique selling points of your products or services.",
      order: 1,
    },
    {
      categoryName: "Sales and Marketing",
      title: "Promotion",
      text: "Mention current promotions, discounts, or special offers when relevant to the visitor's interests.",
      order: 2,
    },
    {
      categoryName: "Sales and Marketing",
      title: "Testimonial",
      text: "Share customer testimonials and success stories to build trust and credibility.",
      order: 3,
    },
    {
      categoryName: "Information & Navigation",
      title: "Navigation Help",
      text: "Help visitors navigate the website by directing them to relevant pages, sections, or resources.",
      order: 1,
    },
    {
      categoryName: "Information & Navigation",
      title: "FAQ Answer",
      text: "Answer frequently asked questions about your business, products, or services.",
      order: 2,
    },
    {
      categoryName: "E-Commerce",
      title: "Order Status",
      text: "Help customers check their order status, track shipments, or manage their account.",
      order: 1,
    },
    {
      categoryName: "E-Commerce",
      title: "Product Recommendation",
      text: "Recommend products based on customer preferences, previous purchases, or current needs.",
      order: 2,
    },
  ];

  for (const snippet of snippets) {
    const category = createdCategories.find(
      (c) => c.name === snippet.categoryName
    );
    if (category) {
      await prisma.snippetExample.upsert({
        where: {
          categoryId_title: {
            categoryId: category.id,
            title: snippet.title,
          },
        },
        update: {},
        create: {
          categoryId: category.id,
          title: snippet.title,
          text: snippet.text,
          order: snippet.order,
        },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
  console.log(
    "\n⚠️  IMPORTANT: Save these credentials securely - they won't be shown again!"
  );
  console.log("\n👤 Superuser:");
  console.log("   Email: superuser@example.com");
  console.log("   Password:", superuserPlainPassword);
  console.log("\n👤 Admin:");
  console.log("   Email: admin@example.com");
  console.log("   Password:", adminPlainPassword);
  console.log("\n👤 User:");
  console.log("   Email: user@example.com");
  console.log("   Password:", userPlainPassword);
  console.log("\n📝 Created snippet categories and examples");
  console.log(
    "\n⚠️  SECURITY: Change these passwords immediately after first login!"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
