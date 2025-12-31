import React from 'react';
import DashboardHeader from '@/components/admin/DashboardHeader';
import ResumesDashboardPage from '@/components/admin/dashboard/ResumesDashboardPage';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader />
      <div className="flex-1 overflow-auto">
        <ResumesDashboardPage />
      </div>
    </div>
  );
}
