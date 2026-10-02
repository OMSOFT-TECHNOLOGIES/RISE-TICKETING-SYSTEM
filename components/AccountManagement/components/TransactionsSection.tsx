import React from 'react';
import { Edit, Eye, Receipt, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import type { ListPagination } from '../../utils/api/client';
import type { Transaction } from '../types';
import { TablePagination } from '../../shared/TablePagination';
import { ScrollableTable } from '../../shared/ScrollableTable';
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES } from '../constants';
import { formatCurrency, getStatusBadge } from '../utils';

interface TransactionsSectionProps {
  transactions: Transaction[];
  totalMatching?: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  onSelectTransaction: (transaction: Transaction) => void;
  canEdit: (transaction: Transaction, userId?: string, isSuperAdmin?: boolean) => boolean;
  userId?: string;
  isSuperAdmin?: boolean;
  page?: number;
  pagination?: ListPagination | null;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function TransactionsSection({
  transactions,
  totalMatching,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  onSelectTransaction,
  canEdit,
  userId,
  isSuperAdmin,
  page = 1,
  pagination = null,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: TransactionsSectionProps) {
  const matchCount = totalMatching ?? transactions.length;
  const hasActiveFilters =
    filterStatus !== 'all' || filterCategory !== 'all' || Boolean(searchQuery.trim());

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="txn-search"
            placeholder="Description, category, source…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-background/80"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background/80">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 bg-background/80">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {[...EXPENSE_CATEGORIES, ...REVENUE_CATEGORIES].map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-muted-foreground"
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
              setFilterCategory('all');
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
        {matchCount} transaction{matchCount !== 1 ? 's' : ''} matching filters
      </p>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
          <Receipt className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="font-medium">No transactions match your filters</p>
        </div>
      ) : (
        <ScrollableTable
          className="rounded-xl ring-1 ring-border/50 border border-border/60"
          maxHeightClass="max-h-[min(65vh,520px)]"
          minWidthClass="min-w-[960px]"
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="group">
                  <TableCell className="text-sm">
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize border ${
                        transaction.type === 'revenue'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200/80 dark:bg-red-950/40 dark:text-red-200'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{transaction.category}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {transaction.description}
                  </TableCell>
                  <TableCell
                    className={`text-sm font-medium tabular-nums ${
                      transaction.type === 'revenue'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {transaction.type === 'revenue' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onSelectTransaction(transaction)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit(transaction, userId, isSuperAdmin) ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollableTable>
      )}

      {onPageChange ? (
        <TablePagination
          page={page}
          pagination={pagination}
          onPageChange={onPageChange}
          itemLabel="transactions"
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          alwaysShow
          className="pt-2"
        />
      ) : null}
    </div>
  );
}
