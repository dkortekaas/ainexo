// components/users/UsersManagement.tsx

"use client";

import { useState, memo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  MoreVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "../ui/card";
import { CardContent } from "../ui/card";
import { logger } from "@/lib/logger";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  department: string | null;
  role: string;
  createdAt: Date;
};

type SortField = "name" | "department" | "role" | "createdAt";
type SortDirection = "asc" | "desc";

type UsersManagementProps = {
  users: User[];
  isAdmin: boolean;
};

type CellProps = {
  row: {
    original: User;
  };
};

const UsersManagementComponent = ({ users, isAdmin }: UsersManagementProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const session = useSession();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [userRoles, setUserRoles] = useState<Record<string, string>>(
    users.reduce((acc, user) => ({ ...acc, [user.id]: user.role }), {})
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "name":
        return direction * (a.name || "").localeCompare(b.name || "");
      case "department":
        return (
          direction * (a.department || "").localeCompare(b.department || "")
        );
      case "role":
        return direction * a.role.localeCompare(b.role);
      case "createdAt":
        return (
          direction *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      default:
        return 0;
    }
  });

  const handleRoleChange = (userId: string, role: string) => {
    setUserRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const handleSaveRole = async (userId: string) => {
    setProcessingId(userId);

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: userRoles[userId] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: errorData.message || t("error.somethingWentWrong"),
          variant: "destructive",
          duration: 3000,
        });

        throw new Error(errorData.message || t("error.somethingWentWrong"));
      }

      toast({
        title: t("success.roleUpdated"),
        variant: "success",
        duration: 3000,
      });

      setEditingUserId(null);
      router.refresh();
    } catch (error) {
      logger.error("Error updating user role:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
        userId: userId,
      });
      toast({
        title: error instanceof Error ? error.message : t("error.unknownError"),
        variant: "destructive",
        duration: 3000,
      });
      setError(
        error instanceof Error ? error.message : t("error.unknownError")
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setProcessingId(userId);

    try {
      const response = await fetch(`/api/users/${userId}/company`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: errorData.message || t("error.somethingWentWrong"),
          variant: "destructive",
          duration: 3000,
        });
      }

      toast({
        title: t("success.userRemoved"),
        variant: "success",
        duration: 3000,
      });
      router.refresh();
    } catch (error) {
      logger.error("Error removing user:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
        userId: userId,
      });
      setError(
        error instanceof Error ? error.message : t("error.unknownError")
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const roleColors: Record<string, string> = {
      ADMIN:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      APPROVER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      USER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };

    return (
      roleColors[role] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      ADMIN: t("roles.admin"),
      APPROVER: t("roles.approver"),
      USER: t("roles.user"),
    };

    return roleLabels[role] || role;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Count the number of admins
  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("common.selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("common.selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort("name")}
        >
          {t("company.user")}
          <span className="ml-1 inline-flex items-center">
            {sortField === "name" ? (
              sortDirection === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
            )}
          </span>
        </div>
      ),
      cell: ({ row }: CellProps) => {
        const user = row.original;
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-primary dark:text-blue-300 font-medium">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "??"}
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name || t("common.unknown")}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort("department")}
        >
          {t("company.department")}
          <span className="ml-1 inline-flex items-center">
            {sortField === "department" ? (
              sortDirection === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
            )}
          </span>
        </div>
      ),
      cell: ({ row }: CellProps) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.original.department || "-"}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort("role")}
        >
          {t("company.role")}
          <span className="ml-1 inline-flex items-center">
            {sortField === "role" ? (
              sortDirection === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
            )}
          </span>
        </div>
      ),
      cell: ({ row }: CellProps) => {
        const user = row.original;
        return editingUserId === user.id ? (
          <Select
            value={userRoles[user.id]}
            onValueChange={(value) => handleRoleChange(user.id, value)}
            disabled={processingId === user.id}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("roles.selectRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">{t("roles.user")}</SelectItem>
              <SelectItem value="APPROVER">{t("roles.approver")}</SelectItem>
              <SelectItem value="ADMIN">{t("roles.admin")}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
            {getRoleLabel(user.role)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => handleSort("createdAt")}
        >
          {t("company.memberSince")}
          <span className="ml-1 inline-flex items-center">
            {sortField === "createdAt" ? (
              sortDirection === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
            )}
          </span>
        </div>
      ),
      cell: ({ row }: CellProps) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: () => (
              <div className="text-right">{t("common.actions")}</div>
            ),
            cell: ({ row }: CellProps) => {
              const user = row.original;
              const isCurrentUser =
                session.status === "authenticated" &&
                user.id === session.data?.user?.id;

              return (
                <div className="text-right">
                  {user.id !== processingId ? (
                    editingUserId === user.id ? (
                      <div className="space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleSaveRole(user.id)}
                          className="flex-1 py-2 text-primary text-sm font-medium border-r border-gray-100 hover:bg-gray-50"
                        >
                          {t("actions.save")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUserId(null)}
                          className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {t("actions.cancel")}
                        </Button>
                      </div>
                    ) : !isCurrentUser ? (
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUserId(user.id)}
                          className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={t("actions.editRole")}
                        >
                          {t("actions.edit")}
                        </Button>

                        {user.role !== "ADMIN" || adminCount > 1 ? (
                          <div className="relative inline-block">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setOpenDropdownId(
                                      openDropdownId === user.id
                                        ? null
                                        : user.id
                                    )
                                  }
                                  className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <MoreVertical className="h-8 w-8" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("company.users.removeUserConfirmation")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("company.users.removeUserWarning")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("actions.cancel")}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveUser(user.id)}
                                  >
                                    {t("actions.remove")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ) : (
                          <div className="flex h-10 w-10"></div>
                        )}
                      </div>
                    ) : null
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary dark:text-blue-400 inline"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t("common.statuses.processing")}
                    </span>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <Card>
      <CardContent>
        {/* Read-only warning for non-admins */}
        {!isAdmin && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 mb-4 p-4 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t("common.readOnlyView")}
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t("common.readOnlyDescription")}
              </p>
            </div>
          </div>
        )}

        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
            {t("company.users.noUsers")}
          </div>
        ) : (
          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={sortedUsers}
              searchColumn="name"
              searchPlaceholder={t("company.users.searchUsers")}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

UsersManagementComponent.displayName = "UsersManagement";

// Memoize to prevent unnecessary re-renders
export const UsersManagement = memo(UsersManagementComponent);
