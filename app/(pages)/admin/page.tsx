// app/(pages)/admin/page.tsx
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layouts";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminSubscriptionsTable } from "@/components/admin/AdminSubscriptionsTable";

export default async function AdminPage() {
  const t = await getTranslations();
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user with role
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  // Check if user is a superuser
  if (!user || user.role !== "SUPERUSER") {
    redirect("/assistants");
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t("admin.dashboard.title")} />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{t("admin.dashboard.users")}</TabsTrigger>
          <TabsTrigger value="cms">CMS</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">
            {t("admin.dashboard.subscriptions")}
          </TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminUsersTable />
        </TabsContent>

        <TabsContent value="cms">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Content Management System
            </p>
            <Link
              href="/admin/cms"
              className="text-primary hover:underline font-medium"
            >
              Go to CMS Dashboard →
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="plans">Plans management coming soon...</TabsContent>

        <TabsContent value="subscriptions">
          <AdminSubscriptionsTable />
        </TabsContent>

        <TabsContent value="invoices">
          <div className="text-center py-8 text-muted-foreground">
            Invoices management coming soon...
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="text-center py-8 text-muted-foreground">
            Payments management coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
