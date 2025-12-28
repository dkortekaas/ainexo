import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getPaginationParams,
  getPrismaOptions,
  createPaginatedResponse,
} from "@/lib/pagination";
import { getUsageLimit } from "@/lib/subscriptionPlans";
import {
  generateApiKey,
  getDefaultSystemPrompt,
} from "@/lib/assistant-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load current user with company for scoping
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse pagination parameters
    const pagination = getPaginationParams(request);

    const where = {
      users: {
        companyId: currentUser.companyId,
      },
    };

    // Get total count for pagination metadata
    const total = await db.chatbotSettings.count({ where });

    // Return assistants for the whole company (all owners within same company)
    const assistants = await db.chatbotSettings.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...getPrismaOptions(pagination),
    });

    // Return paginated response
    return NextResponse.json(
      createPaginatedResponse(assistants, pagination.page, pagination.limit, total)
    );
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load current user and enforce ADMIN role and company membership for creation
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        companyId: true,
        subscriptionPlan: true,
        subscriptionStatus: true
      },
    });

    if (!currentUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    if (!currentUser.companyId) {
      return NextResponse.json(
        { error: "User not associated with a company" },
        { status: 400 }
      );
    }

    // Check subscription limits
    const subscriptionPlan = currentUser.subscriptionPlan;
    const assistantLimit = getUsageLimit(subscriptionPlan, "assistants");

    // Count existing assistants for this company
    const existingAssistantsCount = await db.chatbotSettings.count({
      where: {
        users: {
          companyId: currentUser.companyId,
        },
      },
    });

    // Check if limit would be exceeded (-1 means unlimited)
    if (assistantLimit !== -1 && existingAssistantsCount >= assistantLimit) {
      const planName = subscriptionPlan || "TRIAL";
      return NextResponse.json(
        {
          error: "Assistant limit reached",
          message: `Your ${planName} plan allows ${assistantLimit} assistant${
            assistantLimit === 1 ? "" : "s"
          }. You currently have ${existingAssistantsCount}. Please upgrade your plan to create more assistants.`,
          currentCount: existingAssistantsCount,
          limit: assistantLimit,
          plan: planName,
        },
        { status: 403 }
      );
    }

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
      position,
      showBranding,
      isActive,
      allowedDomains,
      rateLimit,
      mainPrompt,
    } = body;

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

    // Generate unique API key using assistant utils
    const apiKey = generateApiKey();

    // Get system prompt (use provided or default)
    const systemPrompt = mainPrompt || getDefaultSystemPrompt("DEFAULT");

    const assistant = await db.chatbotSettings.create({
      data: {
        id: crypto.randomUUID(),
        // Admin becomes the owner; visibility is company-wide via list filter
        userId: session.user.id,
        name: name || "AI Assistent",
        description: description || "",
        welcomeMessage: welcomeMessage || "Hallo! Hoe kan ik je helpen?",
        placeholderText: placeholderText || "Stel een vraag...",
        primaryColor: primaryColor || "#3B82F6",
        secondaryColor: secondaryColor || "#1E40AF",
        fontFamily: fontFamily || "Inter",
        assistantName: assistantName || name || "AI Assistent",
        assistantSubtitle: assistantSubtitle || "We helpen je graag verder!",
        selectedAvatar: selectedAvatar || "chat-bubble",
        selectedAssistantIcon: selectedAssistantIcon || "robot",
        tone: tone || "professional",
        language: language || "nl",
        maxResponseLength: maxResponseLength || 500,
        temperature: temperature || 0.7,
        fallbackMessage:
          fallbackMessage ||
          "Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie.",
        position: position || "bottom-right",
        showBranding: showBranding !== undefined ? showBranding : true,
        isActive: isActive !== undefined ? isActive : true,
        allowedDomains: allowedDomains || [],
        rateLimit: rateLimit || 10,
        apiKey: apiKey,
        mainPrompt: systemPrompt, // Use provided or default system prompt
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(assistant, { status: 201 });
  } catch (error) {
    console.error("Error creating assistant:", error);
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}
