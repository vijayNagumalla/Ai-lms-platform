import React from 'react';
import PropTypes from 'prop-types';

/**
 * MEDIUM FIX: React Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the entire app.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Log error details to state for display
    this.setState({
      error,
      errorInfo
    });

    // TODO: In production, log to error reporting service (e.g., Sentry)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '2rem auto',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}>
          <h2 style={{ color: '#d32f2f', marginBottom: '1rem' }}>
            {this.props.title || 'Something went wrong'}
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {this.props.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              textAlign: 'left',
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#d32f2f'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                marginRight: '1rem'
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// LOW FIX: Add PropTypes for better type checking
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  fallback: PropTypes.func
};

ErrorBoundary.defaultProps = {
  title: 'Something went wrong',
  message: 'An unexpected error occurred. Please try refreshing the page.',
  fallback: null
};

export default ErrorBoundary;

