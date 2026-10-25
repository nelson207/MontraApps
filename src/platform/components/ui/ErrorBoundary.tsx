import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

// Keeps a crashing module from blanking the whole app shell.
// Error boundaries must be class components (no hook equivalent in React yet).
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Module crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <i className="bi bi-bug display-5 text-danger" />
          <h2 className="h5 mt-3">Something went wrong on this page</h2>
          <p className="text-body-secondary small mb-4">
            The rest of the app still works. You can try again or go to another page.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
