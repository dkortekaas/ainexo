"use client";

import { useState, useEffect, useCallback } from "react";
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
import { MoreVertical, Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { Invitation } from "@/types/account";

interface InvitationsListProps {
  refreshTrigger?: number;
}

export function InvitationsList({ refreshTrigger }: InvitationsListProps) {
  const t = useTranslations();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
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

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch("/api/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      } else if (response.status === 400) {
        // User not associated with a company, try to setup one
        const setupSuccess = await setupCompany();
        if (setupSuccess) {
          // Retry fetching invitations
          const retryResponse = await fetch("/api/invitations");
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setInvitations(data.invitations || []);
          } else {
            throw new Error("Failed to fetch invitations after setup");
          }
        } else {
          throw new Error("Failed to setup company");
        }
      } else {
        throw new Error("Failed to fetch invitations");
      }
    } catch (error) {
      logger.error("Error fetching invitations:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      toast({
        title: t("error.unknownError"),
        variant: "destructive",
        description: t("error.failedToLoadInvitations"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchInvitations();
  }, [refreshTrigger, fetchInvitations]);

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel invitation");
      }

      toast({
        title: t("account.team.invitationCancelled"),
        variant: "success",
        duration: 3000,
      });

      // Refresh the list
      fetchInvitations();
    } catch (error) {
      logger.error("Error cancelling invitation:", {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "EXPIRED":
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return t("common.statuses.pending");
      case "ACCEPTED":
        return t("common.statuses.accepted");
      case "EXPIRED":
        return t("common.statuses.expired");
      case "CANCELLED":
        return t("common.statuses.cancelled");
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "ACCEPTED":
        return "text-green-600 bg-green-100";
      case "EXPIRED":
      case "CANCELLED":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">{t("common.statuses.loading")}</div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t("team.noInvitations")}
        </h3>
        <p className="text-gray-500">{t("team.noInvitationsDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {t("account.pendingInvitations")}
        </h3>
        <span className="text-sm text-gray-500">
          {invitations.filter((inv) => inv.status === "PENDING").length}{" "}
          {t("account.pending")}
        </span>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.email")}</TableHead>
              <TableHead>{t("common.role")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.sentBy")}</TableHead>
              <TableHead>{t("common.sentAt")}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">
                  {invitation.email}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {t(`common.roles.${invitation.role.toLowerCase()}`)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(invitation.status)}
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        getStatusColor(invitation.status)
                      )}
                    >
                      {getStatusText(invitation.status)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {invitation.sender.name || invitation.sender.email}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(invitation.createdAt)}
                </TableCell>
                <TableCell>
                  {invitation.status === "PENDING" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">
                            {t("common.openMenu")}
                          </span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="text-red-600"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {t("account.cancelInvitation")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
