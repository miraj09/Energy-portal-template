// Dashboard Data Types
export interface DashboardData {
  total_sales: number;
  live_sales: number;
  paid_sales: number;
  progress_sales: number;
  dead_sales: number;
  announcements: Announcement[];
}

// Metrics Component Types
export interface MetricsProps {
  totalSales: number;
  liveSales: number;
  paidSales: number;
  progressSales: number;
  deadSales: number;
}

export interface MetricCard {
  title: string;
  value: string;
  percentage: string;
  bgColor: string;
  iconBgColor: string;
  icon: React.ReactNode;
}

// Announcements Component Types
export interface Announcement {
  id: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  is_active: boolean;
  category: string;
  subject: string;
  message: string;
  is_for_all: boolean;
  created_by: string | null;
  deleted_by: string | null;
  users: unknown[];
}

export interface AnnouncementsSectionProps {
  announcements: Announcement[];
}

// Revenue Report Types
export interface RevenueReportData {
  // Add revenue report specific fields when needed
  period?: string;
  revenue?: number;
  growth?: number;
}

export interface RevenueReportProps {
  data?: RevenueReportData;
}

// API Response Types
export interface ApiResponse<T> {
  code: number;
  status: string;
  message: string | null;
  data: T;
  errors: unknown | null;
}

// Loading and Error States
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// Common UI Types
export interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export interface ButtonProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

// Date and Time Types
export interface DateFormatOptions {
  day: "2-digit" | "numeric";
  month: "2-digit" | "numeric" | "long" | "short" | "narrow";
  year: "2-digit" | "numeric";
}

export interface TimeFormatOptions {
  hour: "2-digit" | "numeric";
  minute: "2-digit" | "numeric";
  second: "2-digit" | "numeric";
}

// Chart and Graph Types (for future use)
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      display: boolean;
      position?: "top" | "bottom" | "left" | "right";
    };
    tooltip?: {
      enabled: boolean;
    };
  };
}

// Filter and Search Types
export interface FilterOptions {
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
}

export interface SearchOptions {
  query: string;
  filters?: FilterOptions;
}

// Pagination Types
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginationProps {
  data: PaginationData;
  onPageChange: (page: number) => void;
}
