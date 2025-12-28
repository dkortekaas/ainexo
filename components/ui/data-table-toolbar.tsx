import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { useTranslations } from "next-intl";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchColumn?: string;
  onExport?: () => void;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  searchColumn,
  onExport,
}: DataTableToolbarProps<TData>) {
  const t = useTranslations();
  const defaultSearchPlaceholder = t("common.searchPlaceholder");
  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 items-center space-x-2'>
        <div className='relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500' />
          <Input
            placeholder={searchPlaceholder || defaultSearchPlaceholder}
            value={
              (table
                .getColumn(searchColumn || "")
                ?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table
                .getColumn(searchColumn || "")
                ?.setFilterValue(event.target.value)
            }
            className='h-8 w-[150px] pl-8 lg:w-[250px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
          />
        </div>
        {/* <Select
          onValueChange={(value) => {
            const column = table.getColumn(value);
            if (column) {
              column.setFilterValue("");
            }
          }}
        >
          <SelectTrigger className='h-8 w-[180px]'>
            <SelectValue placeholder='Filter by column' />
          </SelectTrigger>
          <SelectContent>
            {table
              .getAllColumns()
              .filter((column) => column.getCanFilter())
              .map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {column.id}
                </SelectItem>
              ))}
          </SelectContent>
        </Select> */}
      </div>
      {onExport && (
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            className='h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            onClick={handleExport}
          >
            <Download className='mr-2 h-4 w-4' />
            {t("export.export")}
          </Button>
        </div>
      )}
    </div>
  );
}
