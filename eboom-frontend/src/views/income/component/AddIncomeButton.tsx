import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const AddIncomeButton = () => {
  return (
    <div className="w-[36%] mx-auto">
      <Card className="h-[177px]">
        <div style={{
            height: "70px",
            justifySelf: "start",
            fontSize: "24px",
            fontWeight: 600,
        }} className="text-center">Add Income</div>
        <div className="text-center text-sm">Enter your income details.</div>
        <Button className="w-[80%] mx-auto mb-[20px]">+ Add</Button>
      </Card>
    </div>
  );
};

export default AddIncomeButton;
