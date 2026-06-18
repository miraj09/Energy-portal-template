# TableHeader Component

A reusable table header component that provides configurable inputs and buttons for data tables.

## Features

- **Configurable Elements**: Choose which buttons and inputs to show
- **Export Buttons**: CSV and Excel export buttons
- **Search Input**: Search functionality with customizable placeholder
- **Date Range Picker**: Date range selection
- **Filter Button**: Dropdown filter with checkboxes
- **Event Handlers**: Callback functions for all interactions

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | The title displayed on the left side |
| `showCSVButton` | `boolean` | `true` | Show/hide CSV export button |
| `showExcelButton` | `boolean` | `true` | Show/hide Excel export button |
| `showSearchInput` | `boolean` | `true` | Show/hide search input |
| `showDateRangePicker` | `boolean` | `true` | Show/hide date range picker |
| `showFilterButton` | `boolean` | `true` | Show/hide filter button |
| `onCSVExport` | `() => void` | Optional | Callback when CSV button is clicked |
| `onExcelExport` | `() => void` | Optional | Callback when Excel button is clicked |
| `onSearchChange` | `(value: string) => void` | Optional | Callback when search input changes |
| `onDateRangeChange` | `(formattedRange: string, startDate: Date, endDate: Date) => void` | Optional | Callback when date range changes |
| `onFilterChange` | `(filters: { condition: boolean; status: boolean }) => void` | Optional | Callback when filter checkboxes change |
| `searchPlaceholder` | `string` | `"Search"` | Placeholder text for search input |
| `className` | `string` | `""` | Additional CSS classes |

## Usage Examples

### Basic Usage (All elements shown)
```tsx
import TableHeader from '@/components/TableHeader';

<TableHeader
  title="My Data Table"
  onCSVExport={() => handleCSVExport()}
  onExcelExport={() => handleExcelExport()}
  onSearchChange={(value) => handleSearch(value)}
  onDateRangeChange={(formatted, start, end) => handleDateRange(start, end)}
  onFilterChange={(filters) => handleFilters(filters)}
/>
```

### Minimal Header (Only title and search)
```tsx
<TableHeader
  title="Simple Table"
  showCSVButton={false}
  showExcelButton={false}
  showDateRangePicker={false}
  showFilterButton={false}
  onSearchChange={(value) => handleSearch(value)}
/>
```

### Export Only Header
```tsx
<TableHeader
  title="Export Data"
  showSearchInput={false}
  showDateRangePicker={false}
  showFilterButton={false}
  onCSVExport={() => handleCSVExport()}
  onExcelExport={() => handleExcelExport()}
/>
```

### Custom Search Placeholder
```tsx
<TableHeader
  title="User Management"
  searchPlaceholder="Search users..."
  onSearchChange={(value) => handleUserSearch(value)}
/>
```

## Event Handlers

### Search Handler
```tsx
const handleSearch = (searchValue: string) => {
  // Filter your data based on searchValue
  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchValue.toLowerCase())
  );
  setFilteredData(filteredData);
};
```

### Date Range Handler
```tsx
const handleDateRange = (formattedRange: string, startDate: Date, endDate: Date) => {
  // Filter data by date range
  const filteredData = data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate && itemDate <= endDate;
  });
  setFilteredData(filteredData);
};
```

### Filter Handler
```tsx
const handleFilters = (filters: { condition: boolean; status: boolean }) => {
  // Apply filters to your data
  let filteredData = data;
  
  if (filters.condition) {
    filteredData = filteredData.filter(item => item.condition === 'new');
  }
  
  if (filters.status) {
    filteredData = filteredData.filter(item => item.status === 'active');
  }
  
  setFilteredData(filteredData);
};
```

## Styling

The component uses Tailwind CSS classes and follows the existing design system. You can override styles by passing a `className` prop:

```tsx
<TableHeader
  title="Custom Styled Table"
  className="bg-gray-100 p-4 rounded-lg"
/>
``` 