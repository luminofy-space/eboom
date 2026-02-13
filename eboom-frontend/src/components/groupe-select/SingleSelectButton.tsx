import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TProp ={
    isSelected: boolean;
    title: string;
    onClick: () => void;
}

const SingleSelectButton = ({isSelected, title, onClick}: TProp) => {
    return <Button className={cn(
        isSelected && "border-primary!"
      )} variant='outline' onClick={() => onClick()}>{title}</Button>;
}

export default SingleSelectButton;