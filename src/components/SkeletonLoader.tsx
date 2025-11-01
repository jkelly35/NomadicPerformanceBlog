'use client';

import React from 'react';
import { Skeleton, BlogCardSkeleton, StatsCardSkeleton } from './SkeletonLoaders';

interface SkeletonLoaderProps {
  type: 'nutrition' | 'dashboard' | 'training' | 'blog';
}

export default function SkeletonLoader({ type }: SkeletonLoaderProps) {
  switch (type) {
    case 'nutrition':
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header skeleton */}
            <div className="mb-8">
              <Skeleton className="mb-4" height="3rem" width="40%" />
              <Skeleton height="1.5rem" width="60%" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex space-x-4 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="2.5rem" width="120px" />
              ))}
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>

            {/* Table skeleton */}
            <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <Skeleton height="1.5rem" width="30%" />
              </div>
              <div className="divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex justify-between items-center">
                      <Skeleton height="1rem" width="40%" />
                      <Skeleton height="1rem" width="20%" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'dashboard':
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <Skeleton className="mb-8" height="3rem" width="50%" />

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <Skeleton className="mb-4" height="2rem" width="40%" />
                  <Skeleton height="200px" width="100%" />
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <Skeleton height="1.5rem" width="30%" />
              </div>
              <div className="divide-y divide-gray-200">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center space-x-4">
                    <Skeleton height="2.5rem" width="2.5rem" className="rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="mb-1" height="1rem" width="60%" />
                      <Skeleton height="0.875rem" width="40%" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'training':
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <Skeleton className="mb-8" height="3rem" width="40%" />

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>

            {/* Form skeleton */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <Skeleton className="mb-4" height="1.5rem" width="30%" />
              <div className="space-y-4">
                <Skeleton height="2.5rem" width="100%" />
                <Skeleton height="2.5rem" width="100%" />
                <Skeleton height="2.5rem" width="100%" />
                <Skeleton height="10rem" width="100%" />
              </div>
            </div>

            {/* Workout list */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <Skeleton height="1.5rem" width="25%" />
              </div>
              <div className="divide-y divide-gray-200">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex justify-between items-center">
                      <Skeleton height="1rem" width="50%" />
                      <Skeleton height="1rem" width="30%" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'blog':
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <Skeleton className="mb-8" height="3rem" width="50%" />

            {/* Blog posts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return <Skeleton height="400px" width="100%" />;
  }
}
