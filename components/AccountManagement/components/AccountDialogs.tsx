import React from 'react';
import { DollarSign, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import type { NewRevenueSourceForm, NewTransactionForm } from '../types';
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES } from '../constants';

interface AccountDialogsProps {
  showAddTransactionDialog: boolean;
  setShowAddTransactionDialog: (show: boolean) => void;
  newTransaction: NewTransactionForm;
  setNewTransaction: (transaction: NewTransactionForm) => void;
  onAddTransaction: () => void;
  showAddRevenueSourceDialog: boolean;
  setShowAddRevenueSourceDialog: (show: boolean) => void;
  newRevenueSource: NewRevenueSourceForm;
  setNewRevenueSource: (source: NewRevenueSourceForm) => void;
  onAddRevenueSource: () => void;
}

export function AccountDialogs({
  showAddTransactionDialog,
  setShowAddTransactionDialog,
  newTransaction,
  setNewTransaction,
  onAddTransaction,
  showAddRevenueSourceDialog,
  setShowAddRevenueSourceDialog,
  newRevenueSource,
  setNewRevenueSource,
  onAddRevenueSource,
}: AccountDialogsProps) {
  return (
    <>
      <Dialog open={showAddTransactionDialog} onOpenChange={setShowAddTransactionDialog}>
        <DialogContent className="flex max-w-lg flex-col gap-0 p-0">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#193cb8]/10 border border-[#193cb8]/20 p-2.5 shrink-0">
                <DollarSign className="h-5 w-5 text-[#193cb8]" />
              </div>
              <div>
                <DialogTitle>Add New Transaction</DialogTitle>
                <DialogDescription className="mt-1">
                  Record a revenue or expense entry for RISE operations.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select
                  value={newTransaction.type}
                  onValueChange={(value: 'revenue' | 'expense') =>
                    setNewTransaction({ ...newTransaction, type: value, category: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={newTransaction.category}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(newTransaction.type === 'expense' ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES).map(
                    (category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (₵) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the transaction..."
                rows={3}
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              />
            </div>

            {newTransaction.type === 'revenue' ? (
              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  placeholder="Revenue source"
                  value={newTransaction.source}
                  onChange={(e) => setNewTransaction({ ...newTransaction, source: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Input
                  placeholder="Payment recipient"
                  value={newTransaction.recipient}
                  onChange={(e) => setNewTransaction({ ...newTransaction, recipient: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/10 px-6 py-4">
            <Button variant="outline" onClick={() => setShowAddTransactionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onAddTransaction} className="bg-[#193cb8] hover:bg-[#152f94]">
              Add Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddRevenueSourceDialog} onOpenChange={setShowAddRevenueSourceDialog}>
        <DialogContent className="flex max-w-lg flex-col gap-0 p-0">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200/60 p-2.5 shrink-0">
                <PlusCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <DialogTitle>Add Revenue Source</DialogTitle>
                <DialogDescription className="mt-1">
                  Register a new station, union, or regional revenue contributor.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="space-y-2">
              <Label>Source Type *</Label>
              <Select
                value={newRevenueSource.type}
                onValueChange={(value: 'station' | 'union' | 'district' | 'region') =>
                  setNewRevenueSource({ ...newRevenueSource, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="station">Station</SelectItem>
                  <SelectItem value="union">Union</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="region">Region</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Source name"
                value={newRevenueSource.name}
                onChange={(e) => setNewRevenueSource({ ...newRevenueSource, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Region *</Label>
                <Input
                  placeholder="Region name"
                  value={newRevenueSource.region}
                  onChange={(e) => setNewRevenueSource({ ...newRevenueSource, region: e.target.value })}
                />
              </div>
              {(newRevenueSource.type === 'station' || newRevenueSource.type === 'district') && (
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input
                    placeholder="District name"
                    value={newRevenueSource.district}
                    onChange={(e) =>
                      setNewRevenueSource({ ...newRevenueSource, district: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input
                  placeholder="Contact name"
                  value={newRevenueSource.contactPerson}
                  onChange={(e) =>
                    setNewRevenueSource({ ...newRevenueSource, contactPerson: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+233..."
                  value={newRevenueSource.phone}
                  onChange={(e) => setNewRevenueSource({ ...newRevenueSource, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Monthly Target (₵) *</Label>
              <Input
                type="number"
                min={0}
                placeholder="0.00"
                value={newRevenueSource.monthlyTarget}
                onChange={(e) =>
                  setNewRevenueSource({ ...newRevenueSource, monthlyTarget: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/10 px-6 py-4">
            <Button variant="outline" onClick={() => setShowAddRevenueSourceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onAddRevenueSource} className="bg-[#193cb8] hover:bg-[#152f94]">
              Add Revenue Source
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
