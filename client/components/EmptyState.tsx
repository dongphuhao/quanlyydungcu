
import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

const defaultIcon = (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon }) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-gray-400">
    <div className="mb-3 text-gray-300">{icon ?? defaultIcon}</div>
    <p className="text-sm font-semibold text-gray-500">{title}</p>
    {description && <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>}
  </div>
);

export default EmptyState;
