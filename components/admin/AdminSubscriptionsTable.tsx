"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Search,
  ExternalLink,
  CreditCard,
  Calendar,
  User,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/Pagination";
import { logger } from "@/lib/logger";

type Subscription = {
  id: string;
  customerId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  created: string;
  plan: string;
  price: number;
  currency: string;
  interval: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type SortField = "created" | "status" | "plan" | "currentPeriodEnd";
type SortOrder = "asc" | "desc";

type PaginationData = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type SubscriptionsResponse = {
  subscriptions: Subscription[];
  pagination: PaginationData;
};

export function AdminSubscriptionsTable() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortField,
        sortOrder: sortOrder,
      });

      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);

      const response = await fetch(`/api/admin/subscriptions?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }

      const data: SubscriptionsResponse = await response.json();
      setSubscriptions(data.subscriptions);
      setPagination(data.pagination);
    } catch (error) {
      logger.error("Error fetching subscriptions:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      toast({
        title: t("error.title"),
        description: t("error.description"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortField,
    sortOrder,
    search,
    statusFilter,
    t,
  ]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const getStatusBadgeColor = (status: string) => {
    const statusColors: Record<string, string> = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      trialing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      past_due:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      unpaid:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      incomplete:
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      incomplete_expired:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      paused:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return (
      statusColors[status] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const handleViewInStripe = (subscriptionId: string) => {
    const stripeUrl = `https://dashboard.stripe.com/subscriptions/${subscriptionId}`;
    window.open(stripeUrl, "_blank");
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium"
    >
      {children}
      <span className="ml-1">
        {sortField === field ? (
          sortOrder === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ChevronUp className="h-4 w-4 opacity-0" />
        )}
      </span>
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Stripe Subscriptions</CardTitle>
          <div className="text-sm text-muted-foreground">
            {pagination.totalCount} total subscriptions
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="incomplete_expired">
                Incomplete Expired
              </SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="created">Created</SortButton>
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>
                  <SortButton field="plan">Plan</SortButton>
                </TableHead>
                <TableHead>Price</TableHead>
                <TableHead>
                  <SortButton field="status">Status</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="currentPeriodEnd">Next Billing</SortButton>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {formatDate(subscription.created)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium text-sm">
                          {subscription.user?.name
                            ? subscription.user.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "??"}
                        </div>
                        <div>
                          <div className="font-medium">
                            {subscription.user?.name || "Unknown User"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.user?.email ||
                              subscription.customerId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{subscription.plan}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {subscription.interval}ly
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatPrice(subscription.price, subscription.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusBadgeColor(subscription.status)}
                      >
                        {subscription.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      {subscription.cancelAtPeriodEnd && (
                        <div className="text-xs text-orange-600 mt-1">
                          Cancels at period end
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(subscription.currentPeriodEnd)}
                      </div>
                      {subscription.canceledAt && (
                        <div className="text-xs text-red-600">
                          Canceled: {formatDate(subscription.canceledAt)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewInStripe(subscription.id)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View in Stripe
                          </DropdownMenuItem>
                          {subscription.user && (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin?tab=users&search=${subscription.user?.email}`
                                )
                              }
                            >
                              <User className="h-4 w-4 mr-2" />
                              View User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.totalCount}
              itemsPerPage={pagination.limit}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
