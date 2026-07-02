"use client";

import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Typography } from "@/components/ui/typography";

interface ChatComposerProps {
  onSend: (content: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
}

export function ChatComposer({ onSend, isSending, disabled }: ChatComposerProps) {
  const { t } = useTranslation("ai-insights");
  const [value, setValue] = useState("");

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || isSending || disabled) return;
    setValue("");
    await onSend(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="border-t pt-4">
      <InputGroup className="min-h-[44px]">
        <InputGroupTextarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.placeholder")}
          rows={2}
          disabled={disabled || isSending}
          aria-label={t("chat.placeholder")}
        />
        <InputGroupAddon align="block-end" className="justify-end pb-2">
          <InputGroupButton
            size="sm"
            variant="default"
            onClick={() => void handleSend()}
            disabled={!value.trim() || isSending || disabled}
            aria-label={t("chat.send")}
          >
            <Send className="size-4" />
            {t("chat.send")}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <Typography variant="caption" className="mt-2 block">
        {t("chat.hint")}
      </Typography>
    </div>
  );
}
