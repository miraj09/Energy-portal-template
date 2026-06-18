import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { CustomSelect, SelectOption } from "@/ui/select";

interface InfoField {
  label: string;
  value: string;
  type: string;
  key: string;
  options?: SelectOption[];
  onSearch?: (searchTerm: string) => void;
  searchable?: boolean;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  inputType?: "text" | "number" | "email" | "tel";
}

interface DynamicInfoCardProps {
  title: string;
  fields: InfoField[];
  actions?: React.ReactNode;
  isEditing?: boolean;
  onFieldChange?: (key: string, value: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
}

const DynamicInfoCard: React.FC<DynamicInfoCardProps> = ({
  title,
  fields,
  actions,
  isEditing = false,
  onFieldChange,
  // onSave,
  // onCancel,
}) => {
  const handleFieldChange = (key: string, value: string) => {
    if (onFieldChange) {
      onFieldChange(key, value);
    }
  };

  const renderField = (field: InfoField) => {
    if (field.type === "select") {
      const options: SelectOption[] = field.options || [
        { value: "Yes", label: "Yes" },
        { value: "No", label: "No" },
      ];

      return (
        <CustomSelect
          options={options}
          value={options.find((opt) => opt.value === field.value)}
          onChange={(selected) =>
            handleFieldChange(field.key, selected?.value || field.value)
          }
          isDisabled={!isEditing || field.disabled}
          placeholder="Select option"
          className="w-full"
          isSearchable={field.searchable}
          onInputChange={
            field.searchable && field.onSearch
              ? (inputValue) => {
                  if (field.onSearch) {
                    field.onSearch(inputValue);
                  }
                }
              : undefined
          }
        />
      );
    }

    return (
      <Input
        type={field.inputType || "text"}
        value={field.value}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
        className={`w-full border-none rounded px-3 py-2 ${
          isEditing ? "bg-white" : "bg-[#E4E4E4]"
        } text-gray-700 ${field.error ? "border-2 border-red-500" : ""}`}
        readOnly={!isEditing}
        disabled={field.disabled}
      />
    );
  };

  return (
    <div className="  border-b border-gray-400 pb-7 ">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg text-[#363636] font-semibold">{title}</h2>
        {actions && <div className="space-x-2">{actions}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field, index) => (
          <div key={index}>
            <Label className="text-sm font-medium block mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField(field)}
            {field.error && (
              <p className="text-red-500 text-xs mt-1">{field.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicInfoCard;
