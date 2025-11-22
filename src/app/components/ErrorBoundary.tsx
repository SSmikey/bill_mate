'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button } from 'react-bootstrap';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to a service like Sentry
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <Alert variant="danger">
                <Alert.Heading>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  เกิดข้อผิดพลาด
                </Alert.Heading>
                <p className="mb-3">
                  ขออภัยด้วยที่เกิดข้อผิดพลาดขึ้นในระบบ
                  กรุณาลองรีเฟรชหน้าหรือติดต่อผู้ดูแลระบบ
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-3">
                    <summary>ข้อมูลข้อผิดพลาด (Development Mode)</summary>
                    <pre className="mt-2 p-3 bg-light rounded">
                      <code>
                        {this.state.error.toString()}
                        {this.state.errorInfo && (
                          <>
                            {'\n\n'}
                            {this.state.errorInfo.componentStack}
                          </>
                        )}
                      </code>
                    </pre>
                  </details>
                )}
                
                <div className="d-flex gap-2 mt-3">
                  <Button variant="primary" onClick={this.handleReset}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    ลองใหม่
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => window.location.reload()}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    รีเฟรชหน้า
                  </Button>
                </div>
              </Alert>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;