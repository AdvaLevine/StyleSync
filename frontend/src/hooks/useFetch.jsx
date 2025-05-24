import React from 'react';

// Class-based component to replace the useFetch hook
class FetchData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      isPending: true,
      error: null
    };
    this.abortController = null;
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    // Re-fetch if URL changes
    const prevUrl = prevProps.id ? `${prevProps.baseUrl}/${prevProps.id}` : prevProps.baseUrl;
    const currentUrl = this.props.id ? `${this.props.baseUrl}/${this.props.id}` : this.props.baseUrl;
    
    if (prevUrl !== currentUrl) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    // Abort any pending fetch requests
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  fetchData = () => {
    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Create a new abort controller
    this.abortController = new AbortController();
    
    // Construct full URL if id is provided
    const url = this.props.id ? `${this.props.baseUrl}/${this.props.id}` : this.props.baseUrl;
    
    // Reset state
    this.setState({ isPending: true });
    
    fetch(url, { signal: this.abortController.signal })
      .then(res => {
        if (!res.ok) {
          throw Error('Could not fetch the data from ' + url);
        }
        return res.json();
      })
      .then(data => {
        this.setState({
          data: data,
          isPending: false,
          error: null
        });
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          this.setState({
            isPending: false,
            error: err.message
          });
        }
      });
  };

  render() {
    // Pass the state to the render prop
    return this.props.children(this.state);
  }
}

// Usage example:
// <FetchData baseUrl="https://api.example.com/data" id="123">
//   {({ data, isPending, error }) => (
//     <div>
//       {isPending && <p>Loading...</p>}
//       {error && <p>Error: {error}</p>}
//       {data && <p>Data: {JSON.stringify(data)}</p>}
//     </div>
//   )}
// </FetchData>

export default FetchData;
