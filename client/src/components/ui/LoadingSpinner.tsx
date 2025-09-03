import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={clsx('animate-spin rounded-full border-2 border-gray-300 border-t-primary-600', sizeClasses[size], className)} />
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  error?: string;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        {loadingComponent || (
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        {errorComponent || (
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};