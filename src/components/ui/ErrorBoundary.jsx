import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container" style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px dashed #ef4444',
                    borderRadius: '12px',
                    margin: '2rem 0'
                }}>
                    <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Something went wrong</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Failed to load the tool component. This might be due to a network issue or a chunk loading failure.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={this.handleReset}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCcw size={18} />
                        Retry Loading
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
