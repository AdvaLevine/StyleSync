import React, { useState, useEffect } from 'react';
import './MultiSelectDropdown.css'; // Add styles for the multi-select dropdown

export default function MultiSelectDropdown({ options, label, placeholder, onSelect, initialSelectedOptions }) {
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState(initialSelectedOptions || []);
  const [showList, setShowList] = useState(false);

  // Update selected options when initialSelectedOptions changes
  useEffect(() => {
    if (initialSelectedOptions && Array.isArray(initialSelectedOptions)) {
      setSelectedOptions(initialSelectedOptions);
    }
  }, [initialSelectedOptions]);

  // Filter options based on input and exclude already selected options
  const filteredOptions = options
    .filter((option) => typeof option === 'string') // Ensure valid strings
    .filter(
      (option) =>
        option.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedOptions.includes(option)
    );

  const handleSelect = (option) => {
    const newSelectedOptions = [...selectedOptions, option];
    setSelectedOptions(newSelectedOptions);
    setInputValue(''); // Clear the input field
    setShowList(false); // Hide the dropdown
    onSelect(newSelectedOptions); // Pass the updated selections to the parent
  };

  const handleRemove = (option) => {
    const newSelectedOptions = selectedOptions.filter((item) => item !== option);
    setSelectedOptions(newSelectedOptions);
    onSelect(newSelectedOptions); // Pass the updated selections to the parent
  };

  return (
    <div className="multi-select-dropdown">
      <label>{label}</label>
      <div className="dropdown-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowList(true);
          }}
          onFocus={() => setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 200)}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
        />
        {showList && (
          <ul className="dropdown-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, i) => (
                <li key={i} onClick={() => handleSelect(option)}>
                  {option}
                </li>
              ))
            ) : (
              <li className="no-match">No matches</li>
            )}
          </ul>
        )}
      </div>
      
      {selectedOptions.length > 0 && (
        <ul className="selected-options">
          {selectedOptions.map((option, i) => (
            <li key={i} className="selected-option">
              {option}
              <button 
                className="remove-option" 
                onClick={() => handleRemove(option)}
                type="button"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}