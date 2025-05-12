import React, { useState, useEffect } from 'react';
import './Dropdown.css'; // Import the CSS file

export default function Dropdown({ options, label, placeholder, onSelect, disabled, initialValue }) {
  const [inputValue, setInputValue] = useState('');
  const [showList, setShowList] = useState(false);

  // Update input value when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  const validOptions = options.filter((option) => typeof option === 'string');

  const filteredOptions = validOptions.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (option) => {
    setInputValue(option);
    setShowList(false);
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
          setShowList(true);
        }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
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