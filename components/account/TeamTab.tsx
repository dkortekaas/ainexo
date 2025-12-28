"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";
import { Plus, Users, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { InviteTeamMemberModal } from "@/components/team/InviteTeamMemberModal";
import { InvitationsList } from "@/components/team/InvitationsList";
import { MembersList } from "@/components/team/MembersList";
import { EditMemberModal } from "@/components/team/EditMemberModal";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import { TeamMember } from "@/types/account";

export function TeamTab() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "invitations">(
    "members"
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const t = useTranslations();

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleInvite = () => {
    setShowInviteModal(true);
  };

  const handleInviteSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          {t("account.team.title")}
        </h2>
        <Button
          onClick={handleInvite}
          className="bg-primary hover:bg-primary/80 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("account.team.invite")}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("members")}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <Users className="w-4 h-4 inline mr-2" />
            {t("account.team.members")}
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === "invitations"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            {t("account.team.invitations")}
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === "members" ? (
        <MembersList
          refreshTrigger={refreshTrigger}
          onEditMember={handleEditMember}
        />
      ) : (
        <InvitationsList refreshTrigger={refreshTrigger} />
      )}

      {/* Invite Modal */}
      <InviteTeamMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        member={selectedMember}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
