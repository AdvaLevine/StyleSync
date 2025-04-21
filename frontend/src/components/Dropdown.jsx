import React, { useState } from 'react';

export default function Dropdown({ options, label, placeholder, onSelect }) {
  const [inputValue, setInputValue] = useState('');
  const [showList, setShowList] = useState(false);

  // Ensure options are valid strings
  const validOptions = options.filter((option) => typeof option === 'string');

  const filteredOptions = validOptions.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (option) => {
    setInputValue(option);
    setShowList(false); // Hide the dropdown after selection
    onSelect(option);
  };

  return (
    <div className="dropdown">
      <label>{label}</label>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowList(true); // Show the dropdown when typing
        }}
        onFocus={() => setShowList(true)} // Show the dropdown when the input is focused
        onBlur={() => setTimeout(() => setShowList(false), 200)} // Hide the dropdown when the input loses focus
        placeholder={placeholder}
        required
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
  );
}