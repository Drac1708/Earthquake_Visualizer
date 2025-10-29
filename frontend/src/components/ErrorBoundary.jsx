import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h2 className="text-center mt-10 text-red-600">Something went wrong while rendering the map.</h2>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
