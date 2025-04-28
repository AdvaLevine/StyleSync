import React, { useState } from 'react';
import './MultiSelectDropdown.css'; // Add styles for the multi-select dropdown

export default function MultiSelectDropdown({ options, label, placeholder, onSelect }) {
  const [inputValue, setInputValue] = useState('');
  const [showList, setShowList] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]); // Track selected options

  // Filter options based on input and exclude already selected options
  const filteredOptions = options
    .filter((option) => typeof option === 'string') // Ensure valid strings
    .filter(
      (option) =>
        option.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedOptions.includes(option)
    );

  const handleSelect = (option) => {
    const updatedSelections = [...selectedOptions, option];
    setSelectedOptions(updatedSelections);
    setInputValue(''); // Clear the input field
    setShowList(false); // Hide the dropdown
    onSelect(updatedSelections); // Pass the updated selections to the parent
  };

  const handleRemove = (option) => {
    const updatedSelections = selectedOptions.filter((item) => item !== option);
    setSelectedOptions(updatedSelections);
    onSelect(updatedSelections); // Pass the updated selections to the parent
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
          placeholder={placeholder}
        />
        <ul className="selected-options">
          {selectedOptions.map((option, i) => (
            <li key={i} className="selected-option">
              {option}
              <button
                type="button"
                className="remove-option"
                onClick={() => handleRemove(option)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
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
  );
}