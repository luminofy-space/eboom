"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/page-loader";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useAIChat } from "../../hooks/useAIChat";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";

type SendErrorKey =
  | "chat.errors.noApiKey"
  | "chat.errors.rateLimited"
  | "chat.errors.invalidMessage"
  | "chat.errors.sendFailed";

interface AIChatPanelProps {
  canEdit: boolean;
  isActive?: boolean;
}

export function AIChatPanel({ canEdit, isActive = true }: AIChatPanelProps) {
  const { t } = useTranslation("ai-insights");
  const {
    messages,
    isLoading,
    isError,
    refetch,
    sendMessage,
    isSending,
    clearHistory,
    isClearing,
  } = useAIChat();
  const [sendErrorKey, setSendErrorKey] = useState<SendErrorKey | null>(null);

  const handleSend = async (content: string) => {
    setSendErrorKey(null);
    try {
      await sendMessage(content);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setSendErrorKey("chat.errors.noApiKey");
      } else if (status === 429) {
        setSendErrorKey("chat.errors.rateLimited");
      } else if (status === 400) {
        setSendErrorKey("chat.errors.invalidMessage");
      } else {
        setSendErrorKey("chat.errors.sendFailed");
      }
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <Stack gap={4} className="py-4">
        <Typography variant="muted">{t("chat.errors.loadFailed")}</Typography>
        <Button variant="outline" onClick={() => refetch()}>
          {t("errors.retry")}
        </Button>
      </Stack>
    );
  }

  return (
    <Card className="flex min-h-[min(32rem,calc(100dvh-12rem))] flex-1 flex-col gap-0 overflow-hidden py-0">
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-0 pb-0 pt-0">
        <div className="shrink-0 px-6 pt-4">
          <div className="flex items-center justify-between">
            <Typography variant="caption">{t("disclaimer")}</Typography>
            {canEdit && messages.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isClearing || isSending}>
                    <Trash2 className="size-4" />
                    {t("chat.clearHistory")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("chat.clearConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("chat.clearConfirmDescription")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("chat.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void clearHistory()}>
                      {t("chat.clearHistory")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {sendErrorKey && (
            <Typography variant="muted-sm" className="mt-2 text-destructive">
              {t(sendErrorKey)}
            </Typography>
          )}
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <ChatMessageList
            messages={messages}
            isSending={isSending}
            isActive={isActive}
            onSuggestionClick={canEdit ? (suggestion) => void handleSend(suggestion) : undefined}
          />
        </div>

        <div className="shrink-0 border-t bg-card px-6 py-4">
          {canEdit ? (
            <ChatComposer onSend={handleSend} isSending={isSending} />
          ) : (
            <Typography variant="muted-sm">{t("chat.readOnly")}</Typography>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
