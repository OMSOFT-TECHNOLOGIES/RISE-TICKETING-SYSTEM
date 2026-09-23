import React from 'react';
import { Edit, Eye, Receipt, Search, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import type { Transaction } from '../types';
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES } from '../constants';
import { formatCurrency, getStatusBadge } from '../utils';

interface TransactionsSectionProps {
  transactions: Transaction[];
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
}

export function TransactionsSection({
  transactions,
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
}: TransactionsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="txn-search" className="text-xs uppercase tracking-wide text-muted-foreground">
            Search Transactions
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="txn-search"
              placeholder="Search by description, category, source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {[...EXPENSE_CATEGORIES, ...REVENUE_CATEGORIES].map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Transaction Registry
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {transactions.length} record{transactions.length !== 1 ? 's' : ''} matching filters
            </p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wide">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Category</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Description</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Amount</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wide w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No transactions match your filters.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id} className="group">
                  <TableCell className="text-sm">
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        transaction.type === 'revenue'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-red-50 text-red-700 border border-red-200/60'
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
                      transaction.type === 'revenue' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'revenue' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-70 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onSelectTransaction(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit(transaction, userId, isSuperAdmin) && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
