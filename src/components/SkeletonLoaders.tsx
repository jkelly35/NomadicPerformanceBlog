'use client';

import React from 'react';

// Base skeleton component with pulsing animation
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem'
}) => {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
};

// Blog post card skeleton
export const BlogCardSkeleton: React.FC = () => {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      <div className="p-6">
        <Skeleton className="mb-3" height="1.5rem" width="80%" />
        <Skeleton className="mb-4" height="0.875rem" width="40%" />
        <div className="space-y-2">
          <Skeleton height="1rem" width="100%" />
          <Skeleton height="1rem" width="90%" />
          <Skeleton height="1rem" width="75%" />
        </div>
      </div>
    </article>
  );
};

// Stats card skeleton
export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="mb-2" height="0.875rem" width="60%" />
          <Skeleton className="mb-1" height="2.25rem" width="40%" />
          <Skeleton height="0.875rem" width="50%" />
        </div>
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    </div>
  );
};

// Workout card skeleton
export const WorkoutCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Skeleton className="mb-2" height="1.125rem" width="70%" />
          <Skeleton height="0.875rem" width="50%" />
        </div>
      </div>
      <Skeleton height="0.875rem" width="60%" />
    </div>
  );
};

// Form skeleton
export const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="mb-2" height="0.875rem" width="30%" />
        <Skeleton height="2.5rem" width="100%" />
      </div>
      <div>
        <Skeleton className="mb-2" height="0.875rem" width="25%" />
        <Skeleton height="2.5rem" width="100%" />
      </div>
      <div>
        <Skeleton className="mb-2" height="0.875rem" width="35%" />
        <Skeleton height="2.5rem" width="100%" />
      </div>
      <Skeleton height="2.75rem" width="120px" />
    </div>
  );
};

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              height="1rem"
              width={`${Math.random() * 40 + 60}%`}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Hero section skeleton
export const HeroSkeleton: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-2xl p-8 text-white">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="mb-4" height="3rem" width="60%" />
          <Skeleton className="mb-6" height="1.125rem" width="80%" />
          <div className="flex space-x-4">
            <Skeleton height="2rem" width="100px" />
            <Skeleton height="2rem" width="120px" />
          </div>
        </div>
        <div className="hidden md:block">
          <Skeleton className="w-24 h-24 rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Grid skeleton for multiple items
export const GridSkeleton: React.FC<{
  count: number;
  SkeletonComponent: React.ComponentType;
}> = ({ count, SkeletonComponent }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </div>
  );
};

// List skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="0.75rem" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
};
