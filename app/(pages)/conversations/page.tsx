import { ConversationList } from "@/components/conversations/conversation-list";
import { ConversationStats } from "@/components/conversations/conversation-stats";
import { getTranslations } from "next-intl/server";

export default async function ConversationsPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("conversations.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("conversations.description")}
        </p>
      </div>

      <ConversationStats all={0} conversations={0} empty={0} />

      <ConversationList />
    </div>
  );
}
