import { useRef } from 'react';
import Image from 'next/image';
import { Input } from './input';

interface CustomDateInputProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
}

export default function CustomDateInput({ value, onChange, placeholder }: CustomDateInputProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    dateInputRef.current?.showPicker?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div
      className="relative cursor-pointer"
      onClick={handleClick}
    >
      <Input
        type="date"
        value={value || ""}
        onChange={handleChange}
        ref={dateInputRef}
        className="
          h-[32px] sm:h-[35px] w-full border-[0.8px] border-solid border-[#363636] 
          shadow-[0px_1px_2px_rgba(16,24,40,0.05)] rounded-md pl-2 pr-8 sm:pr-10 
          text-xs sm:text-sm lg:text-base text-[#858D9D] cursor-pointer
          appearance-none
          [&::-webkit-calendar-picker-indicator]:opacity-0
          [&::-webkit-calendar-picker-indicator]:pointer-events-none
        "
        placeholder={placeholder}
      />

      <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <Image
          width={22}
          height={22}
          className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]"
          alt="Calendar"
          src="/icons/calender.svg"
        />
      </div>
    </div>
  );
}
