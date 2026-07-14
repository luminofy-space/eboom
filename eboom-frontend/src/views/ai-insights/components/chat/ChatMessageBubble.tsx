"use client";

import { Bot } from "lucide-react";
import { MessageResponse } from "@/components/ai-elements/message";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/src/components/AuthProvider";
import { useTextDirection } from "@/src/i18n/useTextDirection";
import type { AiChatMessage } from "@/src/types/ai-insights";

interface ChatMessageBubbleProps {
  message: AiChatMessage;
}

function getUserInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.[0] ?? "";
  const last = lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "U";
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const { user } = useAuthContext();
  const { isRtl } = useTextDirection();
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser
          ? isRtl
            ? "flex-row"
            : "flex-row-reverse"
          : isRtl
            ? "flex-row-reverse"
            : "flex-row"
      )}
    >
      <Avatar size="sm" className="mt-0.5 shrink-0">
        {isUser ? (
          <>
            <AvatarImage src={user?.photoUrl ?? undefined} alt={user?.firstName ?? "User"} />
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {getUserInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-muted">
            <Bot className="size-3.5 text-muted-foreground" />
          </AvatarFallback>
        )}
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? isRtl
              ? "rounded-tl-sm bg-primary text-primary-foreground"
              : "rounded-tr-sm bg-primary text-primary-foreground"
            : isRtl
              ? "rounded-tr-sm border bg-muted/60 text-foreground"
              : "rounded-tl-sm border bg-muted/60 text-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MessageResponse className="[&_p]:my-1">{message.content}</MessageResponse>
        )}
      </div>
    </div>
  );
}
