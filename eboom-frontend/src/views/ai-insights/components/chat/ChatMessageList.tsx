"use client";

import { useCallback, useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import type { AiChatMessage } from "../../types";
import { ChatMessageBubble } from "./ChatMessageBubble";

const SUGGESTION_KEYS = ["budget", "goals", "cashflow"] as const;

interface ChatMessageListProps {
  messages: AiChatMessage[];
  isSending: boolean;
  isActive?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

function scrollToBottom(container: HTMLDivElement | null) {
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}

function scrollToBottomAfterLayout(container: HTMLDivElement | null) {
  scrollToBottom(container);
  requestAnimationFrame(() => {
    scrollToBottom(container);
    requestAnimationFrame(() => scrollToBottom(container));
  });
}

export function ChatMessageList({
  messages,
  isSending,
  isActive = true,
  onSuggestionClick,
}: ChatMessageListProps) {
  const { t } = useTranslation("ai-insights");
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasActiveRef = useRef(isActive);

  const scrollToLatest = useCallback(() => {
    scrollToBottomAfterLayout(scrollRef.current);
  }, []);

  useEffect(() => {
    if (!isActive) {
      wasActiveRef.current = false;
      return;
    }

    const tabJustOpened = !wasActiveRef.current;
    wasActiveRef.current = true;

    if (tabJustOpened || messages.length > 0 || isSending) {
      scrollToLatest();
    }
  }, [isActive, messages, isSending, scrollToLatest]);

  const isEmpty = messages.length === 0 && !isSending;

  return (
    <div
      ref={scrollRef}
      className="max-h-[min(29rem,calc(100dvh-5rem))] overflow-y-auto overscroll-contain"
    >
      <div className="flex min-h-full flex-col gap-4 p-4">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <Bot className="size-8 text-muted-foreground" />
            <p className="font-medium text-sm">{t("chat.empty")}</p>
            {onSuggestionClick && (
              <Suggestions className="mt-2 justify-center">
                {SUGGESTION_KEYS.map((key) => (
                  <Suggestion
                    key={key}
                    suggestion={t(`chat.suggestions.${key}`)}
                    onClick={onSuggestionClick}
                  />
                ))}
              </Suggestions>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            {isSending && (
              <div className="flex w-full gap-3">
                <Avatar size="sm" className="mt-0.5 shrink-0">
                  <AvatarFallback className="bg-muted">
                    <Bot className="size-3.5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex max-w-[80%] items-center gap-2 rounded-2xl rounded-tl-sm border bg-muted/60 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  <Spinner className="size-4" />
                  <span>{t("chat.thinking")}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
