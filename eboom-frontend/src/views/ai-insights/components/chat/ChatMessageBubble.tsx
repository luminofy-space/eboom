"use client";

import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AiChatMessage } from "../../types";

interface ChatMessageBubbleProps {
  message: AiChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar size="sm" className="mt-1">
        <AvatarFallback className={cn(isUser ? "bg-primary/10" : "bg-muted")}>
          {isUser ? (
            <User className="size-3.5 text-primary" />
          ) : (
            <Bot className="size-3.5 text-muted-foreground" />
          )}
        </AvatarFallback>
      </Avatar>
      <Card
        className={cn(
          "max-w-[85%] py-0 shadow-none",
          isUser ? "bg-primary/5 border-primary/20" : "bg-muted/40"
        )}
      >
        <CardContent className="px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </CardContent>
      </Card>
    </div>
  );
}
