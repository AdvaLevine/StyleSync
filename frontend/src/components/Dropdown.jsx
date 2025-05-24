import React from 'react';
import './Dropdown.css'; // Import the CSS file

export default class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: props.initialValue || '',
      showList: false
    };
  }
  
  componentDidUpdate(prevProps) {
    // Update state if initialValue prop changes
    if (prevProps.initialValue !== this.props.initialValue) {
      this.setState({ inputValue: this.props.initialValue || '' });
    }
  }
  
  handleSelect = (option) => {
    this.setState({
      inputValue: option,
      showList: false
    });
    this.props.onSelect(option);
  };
  
  handleInputChange = (e) => {
    const newValue = e.target.value;
    this.setState({
      inputValue: newValue,
      showList: true
    });
    
    if (newValue === '') {
      this.props.onSelect(''); 
    }
  };
  
  render() {
    const { options, label, placeholder, disabled } = this.props;
    const { inputValue, showList } = this.state;
    
    const validOptions = options.filter((option) => typeof option === 'string');
    
    const filteredOptions = validOptions.filter((option) =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    return (
      <div className="dropdown">
        <label>{label}</label>
        <input
          type="text"
          value={inputValue}
          onChange={this.handleInputChange}
          onFocus={() => this.setState({ showList: true })}
          onBlur={() => setTimeout(() => this.setState({ showList: false }), 200)}
          placeholder={placeholder}
          disabled={disabled}
          required
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
    );
  }
}