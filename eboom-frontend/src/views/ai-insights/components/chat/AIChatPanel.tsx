"use client";

import { useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/page-loader";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useAIChat } from "../../hooks/useAIChat";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";

interface AIChatPanelProps {
  canEdit: boolean;
}

export function AIChatPanel({ canEdit }: AIChatPanelProps) {
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
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSend = async (content: string) => {
    setSendError(null);
    try {
      await sendMessage(content);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setSendError(t("chat.errors.noApiKey"));
      } else if (status === 429) {
        setSendError(t("chat.errors.rateLimited"));
      } else if (status === 400) {
        setSendError(t("chat.errors.invalidMessage"));
      } else {
        setSendError(t("chat.errors.sendFailed"));
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
    <Card className="flex min-h-[480px] flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <MessageSquare className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{t("chat.title")}</CardTitle>
            <Typography variant="muted-sm" className="mt-1">
              {t("chat.subtitle")}
            </Typography>
          </div>
        </div>
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
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-0 pt-0">
        <Typography variant="caption">{t("disclaimer")}</Typography>
        {sendError && (
          <Typography variant="muted-sm" className="mt-3 text-destructive">
            {sendError}
          </Typography>
        )}
        <div className="mt-4 flex min-h-[320px] flex-1 flex-col">
          <ChatMessageList messages={messages} isSending={isSending} />
          {canEdit ? (
            <ChatComposer onSend={handleSend} isSending={isSending} />
          ) : (
            <Typography variant="muted-sm" className="mt-4 border-t pt-4">
              {t("chat.readOnly")}
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
