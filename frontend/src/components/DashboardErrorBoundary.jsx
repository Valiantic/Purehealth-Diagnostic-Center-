import React from 'react';

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen bg-gray-100">
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md border-2 border-red-200 max-w-md">
              <div className="text-center">
                <div className="text-red-600 text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Dashboard Error
                </h2>
                <p className="text-gray-600 mb-4">
                  Something went wrong while loading the dashboard.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
