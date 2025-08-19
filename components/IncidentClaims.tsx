import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Edit2, FileText, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { mockIncidentClaims, mockIncidents, IncidentClaim } from './constants/mockData';
import { toast } from 'sonner';

export function IncidentClaims() {
  const [claims, setClaims] = useState<IncidentClaim[]>(mockIncidentClaims);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<IncidentClaim | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    incidentId: '',
    claimantName: '',
    claimantPhone: '',
    claimantId: '',
    injuryType: 'minor' as 'minor' | 'moderate' | 'severe',
    compensationAmount: 0,
    description: '',
    medicalReports: [] as string[]
  });

  const injuryCompensation = {
    minor: { min: 200, max: 1000, description: 'Minor injuries (bruises, cuts, minor trauma)' },
    moderate: { min: 1000, max: 5000, description: 'Moderate injuries (fractures, sprains, significant trauma)' },
    severe: { min: 5000, max: 20000, description: 'Severe injuries (major fractures, head injuries, permanent damage)' }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.claimantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimantPhone.includes(searchTerm) ||
      claim.incidentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      incidentId: '',
      claimantName: '',
      claimantPhone: '',
      claimantId: '',
      injuryType: 'minor',
      compensationAmount: 0,
      description: '',
      medicalReports: []
    });
  };

  const handleInjuryTypeChange = (injuryType: 'minor' | 'moderate' | 'severe') => {
    const compensation = injuryCompensation[injuryType];
    setFormData({
      ...formData,
      injuryType,
      compensationAmount: compensation.min
    });
  };

  const handleAdd = () => {
    if (!formData.incidentId || !formData.claimantName || !formData.claimantPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newClaim: IncidentClaim = {
      id: `IC${String(claims.length + 1).padStart(3, '0')}`,
      ...formData,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    setClaims([...claims, newClaim]);
    toast.success('Incident claim submitted successfully');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleStatusUpdate = (claimId: string, newStatus: 'approved' | 'rejected' | 'paid') => {
    const updatedClaims = claims.map(claim => {
      if (claim.id === claimId) {
        const updates: Partial<IncidentClaim> = { status: newStatus };
        
        if (newStatus === 'approved' || newStatus === 'rejected') {
          updates.reviewedBy = 'admin';
          updates.reviewedAt = new Date().toISOString();
        }
        
        if (newStatus === 'paid') {
          updates.paymentDate = new Date().toISOString();
        }
        
        return { ...claim, ...updates };
      }
      return claim;
    });

    setClaims(updatedClaims);
    toast.success(`Claim ${newStatus} successfully`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'paid': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'paid': return <DollarSign className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const approvedClaims = claims.filter(c => c.status === 'approved').length;
  const totalCompensation = claims
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.compensationAmount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Incident Claims Management</h1>
          <p className="text-muted-foreground">
            Manage compensation claims for transport incidents
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Claim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Incident Claim</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incidentId">Incident ID *</Label>
                  <Select value={formData.incidentId} onValueChange={(value) => setFormData({ ...formData, incidentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incident" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockIncidents.map(incident => (
                        <SelectItem key={incident.id} value={incident.id}>
                          {incident.id} - {incident.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimantName">Claimant Name *</Label>
                  <Input
                    id="claimantName"
                    value={formData.claimantName}
                    onChange={(e) => setFormData({ ...formData, claimantName: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimantPhone">Phone Number *</Label>
                  <Input
                    id="claimantPhone"
                    value={formData.claimantPhone}
                    onChange={(e) => setFormData({ ...formData, claimantPhone: e.target.value })}
                    placeholder="+233244123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimantId">ID Number</Label>
                  <Input
                    id="claimantId"
                    value={formData.claimantId}
                    onChange={(e) => setFormData({ ...formData, claimantId: e.target.value })}
                    placeholder="Ghana Card, Passport, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="injuryType">Injury Type</Label>
                <Select 
                  value={formData.injuryType} 
                  onValueChange={(value: 'minor' | 'moderate' | 'severe') => handleInjuryTypeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(injuryCompensation).map(([type, info]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex flex-col">
                          <span className="capitalize font-medium">{type}</span>
                          <span className="text-sm text-muted-foreground">
                            GH₵{info.min} - GH₵{info.max}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {injuryCompensation[formData.injuryType].description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compensationAmount">Compensation Amount (GH₵)</Label>
                <Input
                  id="compensationAmount"
                  type="number"
                  value={formData.compensationAmount}
                  onChange={(e) => setFormData({ ...formData, compensationAmount: parseFloat(e.target.value) || 0 })}
                  min={injuryCompensation[formData.injuryType].min}
                  max={injuryCompensation[formData.injuryType].max}
                />
                <p className="text-sm text-muted-foreground">
                  Recommended range: GH₵{injuryCompensation[formData.injuryType].min} - GH₵{injuryCompensation[formData.injuryType].max}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description of Injuries</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of injuries and impact..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>
                Submit Claim
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{totalCompensation.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search claims..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Claimant</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>Injury Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{claim.claimantName}</div>
                      <div className="text-sm text-muted-foreground">{claim.claimantPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{claim.incidentId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {claim.injuryType}
                    </Badge>
                  </TableCell>
                  <TableCell>GH₵{claim.compensationAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" style={{ color: getStatusColor(claim.status) }}>
                      <span className="flex items-center">
                        {getStatusIcon(claim.status)}
                        <span className="ml-1 capitalize">{claim.status}</span>
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(claim.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClaim(claim);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {claim.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(claim.id, 'approved')}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(claim.id, 'rejected')}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {claim.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(claim.id, 'paid')}
                          className="text-blue-600"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Claim Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim Details - {selectedClaim?.id}</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Claimant Information</Label>
                  <div className="mt-2 space-y-1">
                    <p><strong>Name:</strong> {selectedClaim.claimantName}</p>
                    <p><strong>Phone:</strong> {selectedClaim.claimantPhone}</p>
                    <p><strong>ID:</strong> {selectedClaim.claimantId}</p>
                  </div>
                </div>
                <div>
                  <Label>Claim Information</Label>
                  <div className="mt-2 space-y-1">
                    <p><strong>Incident:</strong> {selectedClaim.incidentId}</p>
                    <p><strong>Injury Type:</strong> {selectedClaim.injuryType}</p>
                    <p><strong>Amount:</strong> GH₵{selectedClaim.compensationAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="mt-2 text-sm bg-muted p-3 rounded">
                  {selectedClaim.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <Badge variant="outline" style={{ color: getStatusColor(selectedClaim.status) }}>
                      <span className="flex items-center">
                        {getStatusIcon(selectedClaim.status)}
                        <span className="ml-1 capitalize">{selectedClaim.status}</span>
                      </span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Submitted</Label>
                  <p className="mt-2 text-sm">{new Date(selectedClaim.submittedAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedClaim.reviewedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reviewed By</Label>
                    <p className="mt-2 text-sm">{selectedClaim.reviewedBy}</p>
                  </div>
                  <div>
                    <Label>Reviewed At</Label>
                    <p className="mt-2 text-sm">{new Date(selectedClaim.reviewedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {selectedClaim.paymentDate && (
                <div>
                  <Label>Payment Date</Label>
                  <p className="mt-2 text-sm">{new Date(selectedClaim.paymentDate).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}