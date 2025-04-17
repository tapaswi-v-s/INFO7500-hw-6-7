"use client";

import React from "react";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  max?: string;
  className?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = "0.0",
  disabled = false,
  max,
  className = "",
}) => {
  // Handle input changes, only allow numeric values with decimal
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Allow empty strings, numbers, and decimals only
    if (val === "" || /^[0-9]*[.]?[0-9]*$/.test(val)) {
      onChange(val);
    }
  };
  
  // Handle "Max" button click
  const handleMaxClick = () => {
    if (max) {
      onChange(max);
    }
  };
  
  return (
    <div className={`flex flex-col w-full ${className}`}>
      <div className="flex items-center">
        <input
          type="text"
          className="input input-bordered w-full text-lg focus:outline-none"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        
        {max && (
          <button
            className="btn btn-sm btn-primary ml-2"
            onClick={handleMaxClick}
            disabled={disabled}
          >
            MAX
          </button>
        )}
      </div>
    </div>
  );
};