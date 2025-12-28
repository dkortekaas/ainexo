import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load current user for company scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    // Allow read if assistant owner belongs to same company
    const assistant = await db.chatbotSettings.findFirst({
      where: {
        id,
        users: { companyId: currentUser.companyId },
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error fetching assistant:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load current user for company scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      welcomeMessage,
      placeholderText,
      primaryColor,
      secondaryColor,
      fontFamily,
      assistantName,
      assistantSubtitle,
      selectedAvatar,
      selectedAssistantIcon,
      tone,
      language,
      maxResponseLength,
      temperature,
      fallbackMessage,
      mainPrompt,
      position,
      showBranding,
      isActive,
      allowedDomains,
      rateLimit,
    } = body;

    // Check if assistant exists and belongs to same company
    const existingAssistant = await db.chatbotSettings.findFirst({
      where: {
        id,
        users: { companyId: currentUser.companyId },
      },
    });

    if (!existingAssistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Only ADMINs can update
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!welcomeMessage) {
      return NextResponse.json(
        { error: "Welcome message is required" },
        { status: 400 }
      );
    }

    const assistant = await db.chatbotSettings.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        welcomeMessage,
        placeholderText,
        primaryColor,
        secondaryColor,
        fontFamily,
        assistantName,
        assistantSubtitle,
        selectedAvatar,
        selectedAssistantIcon,
        tone,
        language,
        maxResponseLength,
        temperature,
        fallbackMessage,
        mainPrompt,
        position,
        showBranding,
        isActive,
        allowedDomains,
        rateLimit,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error updating assistant:", error);
    return NextResponse.json(
      { error: "Failed to update assistant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load current user for company scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    // Check if assistant exists and belongs to same company
    const existingAssistant = await db.chatbotSettings.findFirst({
      where: {
        id,
        users: { companyId: currentUser.companyId },
      },
    });

    if (!existingAssistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Only ADMINs can delete
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Delete assistant (this will cascade delete all related data)
    await db.chatbotSettings.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Assistant deleted successfully" });
  } catch (error) {
    console.error("Error deleting assistant:", error);
    return NextResponse.json(
      { error: "Failed to delete assistant" },
      { status: 500 }
    );
  }
}
