import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Database, ChevronRight } from 'lucide-react';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  headerClassName?: string;
  minWidth?: string;
  hidden?: 'sm' | 'md' | 'lg' | 'xl';
}

interface DatasetsTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  tokens: any;
  isDark?: boolean;
  getRowKey: (item: T) => string;
}

export function DatasetsTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription = 'Try adjusting your search or filters',
  tokens,
  isDark = false,
  getRowKey,
}: DatasetsTableProps<T>) {
  if (data.length === 0) {
    return (
      <Card
        className="p-12"
        style={{
          background: tokens.surfaceCard,
          borderColor: tokens.borderDefault,
        }}
      >
        <div className="text-center">
          {emptyIcon || <Database className="w-16 h-16 mx-auto mb-4" style={{ color: tokens.textMuted }} />}
          <h3 className="text-xl font-semibold mb-2" style={{ color: tokens.textPrimary }}>
            {emptyTitle}
          </h3>
          <p className="mb-6" style={{ color: tokens.textSecondary }}>
            {emptyDescription}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div
      className="rounded-lg sm:rounded-xl border overflow-hidden flex flex-col h-full"
      style={{
        background: tokens.surfaceCard,
        borderColor: tokens.borderDefault,
      }}
    >
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          <thead
            style={{
              background: isDark
                ? 'rgba(26, 34, 64, 0.4)'
                : 'rgba(248, 249, 250, 0.8)',
              borderBottom: `1px solid ${tokens.borderDefault}`,
            }}
          >
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-3 sm:px-6 py-3 sm:py-4 ${
                    column.headerClassName || 'text-left'
                  } ${
                    column.hidden === 'sm' ? 'hidden sm:table-cell' :
                    column.hidden === 'md' ? 'hidden md:table-cell' :
                    column.hidden === 'lg' ? 'hidden lg:table-cell' :
                    column.hidden === 'xl' ? 'hidden xl:table-cell' : ''
                  }`}
                  style={{
                    color: tokens.textSecondary,
                    fontWeight: '600',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    minWidth: column.minWidth || 'auto',
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => {
              const isLastRow = rowIndex === data.length - 1;

              return (
                <tr
                  key={getRowKey(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`${onRowClick ? 'cursor-pointer' : ''} transition-colors duration-150 text-sm`}
                  style={{
                    borderBottom: isLastRow
                      ? 'none'
                      : `1px solid ${tokens.borderSubtle}`,
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick) {
                      e.currentTarget.style.background = tokens.rowHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {columns.map((column, colIndex) => {
                    const value = typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : item[column.accessor];

                    return (
                      <td
                        key={colIndex}
                        className={`px-3 sm:px-6 py-3 sm:py-4 ${
                          column.className || ''
                        } ${
                          column.hidden === 'sm' ? 'hidden sm:table-cell' :
                          column.hidden === 'md' ? 'hidden md:table-cell' :
                          column.hidden === 'lg' ? 'hidden lg:table-cell' :
                          column.hidden === 'xl' ? 'hidden xl:table-cell' : ''
                        }`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
