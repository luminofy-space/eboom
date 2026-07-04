"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import type { AiChatMessage } from "../../types";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface ChatMessageListProps {
  messages: AiChatMessage[];
  isSending: boolean;
}

export function ChatMessageList({ messages, isSending }: ChatMessageListProps) {
  const { t } = useTranslation("ai-insights");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  if (messages.length === 0 && !isSending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        <Typography variant="muted">{t("chat.empty")}</Typography>
        <Stack gap={2} className="mt-6 w-full max-w-md">
          {(["budget", "goals", "cashflow"] as const).map((key) => (
            <Typography key={key} variant="muted-sm" className="text-start">
              • {t(`chat.suggestions.${key}`)}
            </Typography>
          ))}
        </Stack>
      </div>
    );
  }

  return (
    <Stack gap={4} className="flex-1 overflow-y-auto px-1 py-2">
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      {isSending && (
        <div className="flex gap-3">
          <Avatar size="sm" className="mt-1">
            <AvatarFallback className="bg-muted">
              <Bot className="size-3.5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <Card className="max-w-[85%] bg-muted/40 py-0 shadow-none">
            <CardContent className="flex gap-2 px-3 py-3">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </CardContent>
          </Card>
        </div>
      )}
      <div ref={bottomRef} />
    </Stack>
  );
}
