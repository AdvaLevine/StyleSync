import React from 'react';
import './MultiSelectDropdown.css'; // Add styles for the multi-select dropdown

export default class MultiSelectDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      selectedOptions: props.initialSelectedOptions || [],
      showList: false
    };
  }
  
  componentDidUpdate(prevProps) {
    // Update selected options when initialSelectedOptions changes
    if (prevProps.initialSelectedOptions !== this.props.initialSelectedOptions &&
        this.props.initialSelectedOptions && Array.isArray(this.props.initialSelectedOptions)) {
      this.setState({ selectedOptions: this.props.initialSelectedOptions });
    }
  }
  
  handleSelect = (option) => {
    const newSelectedOptions = [...this.state.selectedOptions, option];
    this.setState({
      selectedOptions: newSelectedOptions,
      inputValue: '', // Clear the input field
      showList: false // Hide the dropdown
    });
    this.props.onSelect(newSelectedOptions); // Pass the updated selections to the parent
  };
  
  handleRemove = (option) => {
    const newSelectedOptions = this.state.selectedOptions.filter((item) => item !== option);
    this.setState({ selectedOptions: newSelectedOptions });
    this.props.onSelect(newSelectedOptions); // Pass the updated selections to the parent
  };
  
  handleInputChange = (e) => {
    this.setState({
      inputValue: e.target.value,
      showList: true
    });
  };
  
  render() {
    const { options, label, placeholder } = this.props;
    const { inputValue, selectedOptions, showList } = this.state;
    
    // Filter options based on input and exclude already selected options
    const filteredOptions = options
      .filter((option) => typeof option === 'string') // Ensure valid strings
      .filter(
        (option) =>
          option.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedOptions.includes(option)
      );
    
    return (
      <div className="multi-select-dropdown">
        <label>{label}</label>
        <div className="dropdown-input-container">
          <input
            type="text"
            value={inputValue}
            onChange={this.handleInputChange}
            onFocus={() => this.setState({ showList: true })}
            onBlur={() => setTimeout(() => this.setState({ showList: false }), 200)}
            placeholder={selectedOptions.length === 0 ? placeholder : ''}
          />
          {showList && (
            <ul className="dropdown-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, i) => (
                  <li key={i} onClick={() => this.handleSelect(option)}>
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
                  onClick={() => this.handleRemove(option)}
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
}