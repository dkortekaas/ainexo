import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getTranslations } from "next-intl/server";

export async function createNotification(userId: string, message: string) {
  try {
    const notification = await db.notification.create({
      data: {
        message,
        createdBy: userId,
        title: "Nieuwe notificatie",
      },
    });

    logger.info("Notification created successfully", {
      context: {
        notificationId: notification.id,
        userId,
      },
    });

    return notification;
  } catch (error) {
    logger.error("Failed to create notification", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        userId,
        message,
      },
    });
    throw error;
  }
}

export async function createInvitationCancellationNotification({
  userId,
  companyName,
  recipientEmail,
}: {
  userId: string;
  companyName: string;
  recipientEmail: string;
}) {
  try {
    const notification = await db.notification.create({
      data: {
        message: `Uitnodiging voor ${companyName} is ingetrokken`,
        title: "Uitnodiging ingetrokken",
        createdBy: userId,
      },
    });
  } catch (error) {
    logger.error("Failed to create invitation cancellation notification", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        userId,
        companyName,
        recipientEmail,
      },
    });
    throw error;
  }
}

export async function createInvitationNotification({
  userId,
  companyName,
  invitedEmail,
}: {
  userId: string;
  companyName: string;
  invitedEmail: string;
}) {
  try {
    const notification = await db.notification.create({
      data: {
        message: `${invitedEmail} is uitgenodigd voor ${companyName}`,
        title: "Uitnodiging",
        createdBy: userId,
      },
    });
  } catch (error) {
    logger.error("Failed to create invitation notification", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        userId,
        companyName,
        invitedEmail,
      },
    });
    throw error;
  }
}

export async function createTeamMemberRemovalNotification({
  userId,
  companyName,
  recipientEmail,
}: {
  userId: string;
  companyName: string;
  recipientEmail: string;
}) {
  try {
    const notification = await db.notification.create({
      data: {
        message: `Team lid ${recipientEmail} is verwijderd uit ${companyName}`,
        title: "Team lid verwijderd",
        createdBy: userId,
      },
    });
  } catch (error) {
    logger.error("Failed to create team member removal notification", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        userId,
        companyName,
        recipientEmail,
      },
    });
    throw error;
  }
}
