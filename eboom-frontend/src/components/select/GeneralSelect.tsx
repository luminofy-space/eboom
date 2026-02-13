import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type GeneralSelectOption = {
  label: string;
  value: string;
}

type GeneralSelectGroup = {
  label: string;
  options: GeneralSelectOption[];
}

interface GeneralSelectProps {
  groups: GeneralSelectGroup[];
  placeholder: string;
}

export function GeneralSelect({ groups, placeholder }: GeneralSelectProps) {
  return (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {groups.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
