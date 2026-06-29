import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  chartTitle?: string;
  onRetry?: () => void;
  className?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ChartErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ChartErrorBoundary]", error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { chartTitle = "Chart", className } = this.props;

    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center",
          "border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]",
          className
        )}
      >
        <svg
          className="h-8 w-8 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {chartTitle} unavailable
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            An error occurred while rendering this chart.
          </p>
        </div>
        {this.props.onRetry && (
          <button
            onClick={this.handleRetry}
            className="mt-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
}
