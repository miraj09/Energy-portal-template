import { Card, CardContent } from "@/ui/card";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";

interface InfoField {
  label: string;
  value: string;
}

interface InfoCardProps {
  title: string;
  fields: InfoField[];
  actions?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, fields, actions }) => {
  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-[#363636] font-semibold">
            {title}
          </h2>
          {actions && (
            <div className="space-x-2">
              {actions}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field, index) => (
            <div key={index}>
              <Label className="text-sm font-medium block mb-1">
                {field.label}
              </Label>
              <Input
                type="text"
                value={field.value}
                className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700"
                readOnly
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InfoCard; 