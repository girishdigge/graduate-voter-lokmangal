import React from 'react';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  value?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  className = '',
  id,
  name,
  value,
}) => {
  const handleChange = (newChecked: boolean) => {
    if (onChange && !disabled) {
      onChange(newChecked);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={e => handleChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`
          w-4 h-4 border-2 rounded flex items-center justify-center cursor-pointer transition-colors
          ${
            checked || indeterminate
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => {
          if (!disabled) {
            handleChange(!checked);
          }
        }}
      >
        {indeterminate ? (
          <Minus className="h-3 w-3" />
        ) : checked ? (
          <Check className="h-3 w-3" />
        ) : null}
      </div>
    </div>
  );
};
