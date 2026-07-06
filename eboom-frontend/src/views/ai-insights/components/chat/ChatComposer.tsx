"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { InputGroupAddon } from "@/components/ui/input-group";
import { Typography } from "@/components/ui/typography";

const MIN_TEXTAREA_HEIGHT_PX = 40;
const MAX_TEXTAREA_HEIGHT_PX = 128;

interface ChatComposerProps {
  onSend: (content: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
}

export function ChatComposer({ onSend, isSending, disabled }: ChatComposerProps) {
  const { t } = useTranslation("ai-insights");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustTextareaHeight = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;

    element.style.height = "auto";
    const nextHeight = Math.min(
      Math.max(element.scrollHeight, MIN_TEXTAREA_HEIGHT_PX),
      MAX_TEXTAREA_HEIGHT_PX
    );
    element.style.height = `${nextHeight}px`;
    element.style.overflowY =
      element.scrollHeight > MAX_TEXTAREA_HEIGHT_PX ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    if (!isSending) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [isSending, adjustTextareaHeight]);

  return (
    <div>
      <PromptInput
        className="w-full [&_[data-slot=input-group]]:items-end"
        onSubmit={async (message, event) => {
          event.preventDefault();
          const text = message.text.trim();
          if (!text || isSending || disabled) return;
          await onSend(text);
          adjustTextareaHeight(textareaRef.current);
        }}
      >
        <PromptInputTextarea
          className="min-h-10 resize-none py-2 pl-3"
          placeholder={t("chat.placeholder")}
          disabled={disabled || isSending}
          aria-label={t("chat.placeholder")}
          rows={1}
          onChange={(event) => {
            textareaRef.current = event.currentTarget;
            adjustTextareaHeight(event.currentTarget);
          }}
        />
        <InputGroupAddon align="inline-end" className="pb-1.5 pr-4">
          <PromptInputSubmit
            status={isSending ? "submitted" : undefined}
            disabled={isSending || disabled}
            aria-label={t("chat.send")}
            className="shrink-0"
          />
        </InputGroupAddon>
      </PromptInput>
      <Typography variant="caption" className="mt-2 block">
        {t("chat.hint")}
      </Typography>
    </div>
  );
}
