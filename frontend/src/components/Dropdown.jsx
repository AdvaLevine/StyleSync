import React, { useState, useEffect } from 'react';
import './Dropdown.css'; // Import the CSS file

export default function Dropdown({ options, label, placeholder, onSelect, disabled, initialValue }) {
  const [inputValue, setInputValue] = useState(initialValue || '');
  const [showList, setShowList] = useState(false);

  // חשוב מאוד: עדכון ערך הקלט כאשר initialValue משתנה
  useEffect(() => {
    setInputValue(initialValue || '');
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

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowList(true);
    
    // אם המשתמש מוחק את כל הטקסט, מודיעים למרכיב ההורה
    if (newValue === '') {
      onSelect(''); // שליחת מחרוזת ריקה מאותתת שהשדה נמחק
    }
  };

  return (
    <div className="dropdown">
      <label>{label}</label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
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