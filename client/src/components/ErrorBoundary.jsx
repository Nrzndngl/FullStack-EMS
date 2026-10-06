import { Component } from "react";
import Button from "./ui/Button";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Renderer crashed:", error, info?.componentStack || "");
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
          <div className="card p-8 max-w-md w-full text-center">
            <h1 className="text-xl font-bold text-ink-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-ink-500 mb-6">
              The page hit an unexpected error. Reloading usually fixes it.
            </p>
            <Button onClick={this.handleReload} className="w-full">
              Reload page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;