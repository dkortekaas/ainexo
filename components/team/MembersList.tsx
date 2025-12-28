"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  MoreVertical,
  Users,
  Pencil,
  Trash,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { TeamMember } from "@/types/account";

interface MembersListProps {
  refreshTrigger?: number;
  onEditMember?: (member: TeamMember) => void;
}

export function MembersList({
  refreshTrigger,
  onEditMember,
}: MembersListProps) {
  const t = useTranslations();
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const setupCompany = async () => {
    try {
      const response = await fetch("/api/team/setup-company", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to setup company");
      }
      return true;
    } catch (error) {
      logger.error("Error setting up company:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return false;
    }
  };

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/team/members");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else if (response.status === 400) {
        // User not associated with a company, try to setup one
        const setupSuccess = await setupCompany();
        if (setupSuccess) {
          // Retry fetching team members
          const retryResponse = await fetch("/api/team/members");
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setMembers(data.members || []);
          } else {
            throw new Error("Failed to fetch team members after setup");
          }
        } else {
          throw new Error("Failed to setup company");
        }
      } else {
        throw new Error("Failed to fetch team members");
      }
    } catch (error) {
      logger.error("Error fetching team members:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      toast({
        title: t("error.unknownError"),
        variant: "destructive",
        description: t("error.failedToLoadMembers"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMembers();
  }, [refreshTrigger, fetchMembers]);

  const handleEditMember = (member: TeamMember) => {
    if (onEditMember) {
      onEditMember(member);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(t("account.team.confirmDeleteMember", { name: memberName }))) {
      return;
    }

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete member");
      }

      toast({
        title: t("account.team.memberDeleted"),
        variant: "success",
        duration: 3000,
      });

      // Refresh the list
      fetchMembers();
    } catch (error) {
      logger.error("Error deleting member:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      toast({
        title: t("error.unknownError"),
        variant: "destructive",
        description:
          error instanceof Error ? error.message : t("error.unknownError"),
      });
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive
      ? t("common.statuses.active")
      : t("common.statuses.inactive");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">{t("common.statuses.loading")}</div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t("account.team.noMembersFound")}
        </h3>
        <p className="text-gray-500">
          {t("account.team.noMembersDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {t("account.team.members")}
        </h3>
        <span className="text-sm text-gray-500">
          {members.length} {t("account.team.totalMembers")}
        </span>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("account.team.user")}</TableHead>
              <TableHead>{t("common.role")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("account.team.registered")}</TableHead>
              <TableHead>{t("account.team.lastLogin")}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium text-sm">
                        {member.initials}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {member.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {t(`common.roles.${member.role.toLowerCase()}`)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(member.isActive)}
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        getStatusColor(member.isActive)
                      )}
                    >
                      {getStatusText(member.isActive)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {member.registered}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {member.lastLogin}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t("common.openMenu")}</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditMember(member)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      {member.id !== session?.user?.id && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteMember(member.id, member.name)
                          }
                          className="text-red-600"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          {t("common.remove")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
