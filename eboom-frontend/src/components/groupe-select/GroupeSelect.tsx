import { useState } from "react";
import SingleSelectButton from "./SingleSelectButton";

export type TItem = {
  key: string;
  title: string;
};

type TProps = {
  items: TItem[];
  handleSelect: (e: TItem) => void;
  value: string;
};

const GroupSelect = ({ items, handleSelect, value }: TProps) => {
  const [selected, setSelected] = useState<string | null>(value);
  const onClick = (item: TItem) => {
    handleSelect(item);
    setSelected(item.key);
  };

  return (
    <div className="flex flex-row space-x-4">
      {items.map((item) => (
        <SingleSelectButton
          key={item.key}
          title={item.title}
          onClick={() => onClick(item)}
          isSelected={selected === item.key}
        />
      ))}
    </div>
  );
};

export default GroupSelect;
