'use client';

import { useState, useRef, useEffect } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface StyledSelectProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  options: Array<{
    value: string | number;
    label: string;
  }>;
  label?: string;
  icon?: string;
  disabled?: boolean;
  required?: boolean;
  register?: UseFormRegisterReturn;
}

export default function StyledSelect({
  value,
  onChange,
  options,
  label,
  icon,
  disabled = false,
  required = false,
  register,
}: StyledSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value?.toString() || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentValue = register ? internalValue : value?.toString();
  const selectedOption = options.find((opt) => opt.value.toString() === currentValue);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update internal value when prop value changes
  useEffect(() => {
    if (!register && value !== undefined) {
      setInternalValue(value.toString());
    }
  }, [value, register]);

  return (
    <div className="position-relative" ref={dropdownRef}>
      <label className="form-label fw-medium text-dark mb-2">
        {icon && <i className={`${icon} me-2 text-primary`}></i>}
        {label}
      </label>

      <button
        className="btn btn-light w-100 text-start d-flex justify-content-between align-items-center border-0 rounded-2 shadow-sm"
        style={{
          padding: '0.625rem 0.875rem',
          fontSize: '0.95rem',
          backgroundColor: disabled ? '#e9ecef' : '#f8f9fa',
          color: disabled ? '#6c757d' : '#212529',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        type="button"
        disabled={disabled}
      >
        <span className={disabled ? 'text-muted' : 'text-dark'}>
          {selectedOption?.label || 'เลือก'}
        </span>
        <i
          className="bi bi-chevron-down"
          style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: disabled ? 0.5 : 1,
          }}
        ></i>
      </button>

      {isOpen && (
        <div
          className="position-absolute w-100 mt-2 bg-white border rounded-2 shadow-lg"
          style={{
            zIndex: 1000,
            top: '100%',
            left: 0,
            maxHeight: '250px',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              className="w-100 text-start py-2 px-3 border-0 bg-transparent text-dark"
              style={{
                borderBottom: '1px solid #e9ecef',
                transition: 'all 0.2s',
                backgroundColor:
                  currentValue === option.value ? '#e7f1ff' : 'transparent',
                color: currentValue === option.value ? '#0d6efd' : '#212529',
              }}
              onMouseEnter={(e) => {
                if (currentValue !== option.value) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (currentValue !== option.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                const newValue = option.value.toString();
                if (register) {
                  setInternalValue(newValue);
                  register.onChange({ target: { value: newValue } });
                } else {
                  setInternalValue(newValue);
                  onChange?.(option.value); // Pass original value type
                }
                setIsOpen(false);
              }}
            >
              <div className="d-flex align-items-center">
                {currentValue === option.value && (
                  <i className="bi bi-check-lg me-2 text-primary"></i>
                )}
                <span className={currentValue === option.value ? 'fw-semibold' : ''}>
                  {option.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
