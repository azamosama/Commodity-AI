import { CostManagementProvider } from '@/contexts/CostManagementContext';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CostManagementProvider>
      {children}
    </CostManagementProvider>
  );
} 