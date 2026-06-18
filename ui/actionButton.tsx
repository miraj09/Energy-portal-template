import React from "react";

export interface ActionButtonProps {
  onClick: () => void;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      className={`group p-2 hover:bg-white rounded-full hover:border-[#2986cc] focus:outline-none bg-[#2986cc] cursor-pointer transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      <svg
        width="16"
        className="text-white group-hover:text-[#2986cc] transition-colors duration-200"
        height="16"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <circle cx="10" cy="4" r="1.5" fill="currentColor" />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        <circle cx="10" cy="16" r="1.5" fill="currentColor" />
      </svg>
    </button>
  );
};

export default ActionButton;
