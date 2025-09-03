import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase } from 'lucide-react';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/jobs" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Details</h1>
          <p className="text-gray-500">Job ID: {id}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Briefcase className="h-8 w-8 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Job Information</h2>
        </div>
        <p className="text-gray-500">Job details will be implemented here.</p>
      </div>
    </div>
  );
};