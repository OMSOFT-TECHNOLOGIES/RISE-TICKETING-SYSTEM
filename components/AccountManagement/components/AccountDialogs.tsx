import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { NewTransactionForm, NewRevenueSourceForm } from '../types';
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES } from '../constants';

interface AccountDialogsProps {
  // Add Transaction Dialog
  showAddTransactionDialog: boolean;
  setShowAddTransactionDialog: (show: boolean) => void;
  newTransaction: NewTransactionForm;
  setNewTransaction: (transaction: NewTransactionForm) => void;
  onAddTransaction: () => void;
  
  // Add Revenue Source Dialog
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
  onAddRevenueSource
}: AccountDialogsProps) {
  return (
    <>
      {/* Add Transaction Dialog */}
      <Dialog open={showAddTransactionDialog} onOpenChange={setShowAddTransactionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Record a new financial transaction for RISE operations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Transaction Type</Label>
              <Select 
                value={newTransaction.type} 
                onValueChange={(value: 'revenue' | 'expense') => 
                  setNewTransaction({...newTransaction, type: value, category: ''})
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

            <div>
              <Label>Category *</Label>
              <Select 
                value={newTransaction.category} 
                onValueChange={(value) => setNewTransaction({...newTransaction, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(newTransaction.type === 'expense' ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount (₵) *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the transaction..."
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
              />
            </div>

            {newTransaction.type === 'revenue' ? (
              <div>
                <Label>Source</Label>
                <Input
                  placeholder="Revenue source"
                  value={newTransaction.source}
                  onChange={(e) => setNewTransaction({...newTransaction, source: e.target.value})}
                />
              </div>
            ) : (
              <div>
                <Label>Recipient</Label>
                <Input
                  placeholder="Payment recipient"
                  value={newTransaction.recipient}
                  onChange={(e) => setNewTransaction({...newTransaction, recipient: e.target.value})}
                />
              </div>
            )}

            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddTransactionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={onAddTransaction}>
                Add Transaction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Revenue Source Dialog */}
      <Dialog open={showAddRevenueSourceDialog} onOpenChange={setShowAddRevenueSourceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Revenue Source</DialogTitle>
            <DialogDescription>
              Register a new source of revenue for the RISE system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Source Type *</Label>
              <Select 
                value={newRevenueSource.type} 
                onValueChange={(value: 'station' | 'union' | 'district' | 'region') => 
                  setNewRevenueSource({...newRevenueSource, type: value})
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

            <div>
              <Label>Name *</Label>
              <Input
                placeholder="Source name"
                value={newRevenueSource.name}
                onChange={(e) => setNewRevenueSource({...newRevenueSource, name: e.target.value})}
              />
            </div>

            <div>
              <Label>Region *</Label>
              <Input
                placeholder="Region name"
                value={newRevenueSource.region}
                onChange={(e) => setNewRevenueSource({...newRevenueSource, region: e.target.value})}
              />
            </div>

            {(newRevenueSource.type === 'station' || newRevenueSource.type === 'district') && (
              <div>
                <Label>District</Label>
                <Input
                  placeholder="District name"
                  value={newRevenueSource.district}
                  onChange={(e) => setNewRevenueSource({...newRevenueSource, district: e.target.value})}
                />
              </div>
            )}

            <div>
              <Label>Contact Person *</Label>
              <Input
                placeholder="Contact person name"
                value={newRevenueSource.contactPerson}
                onChange={(e) => setNewRevenueSource({...newRevenueSource, contactPerson: e.target.value})}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                placeholder="Contact phone number"
                value={newRevenueSource.phone}
                onChange={(e) => setNewRevenueSource({...newRevenueSource, phone: e.target.value})}
              />
            </div>

            <div>
              <Label>Monthly Target (₵) *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newRevenueSource.monthlyTarget}
                onChange={(e) => setNewRevenueSource({...newRevenueSource, monthlyTarget: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddRevenueSourceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={onAddRevenueSource}>
                Add Revenue Source
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}