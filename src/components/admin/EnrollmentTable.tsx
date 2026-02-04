import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Edit2, Save, X, Plus } from 'lucide-react';

interface Enrollment {
  _id: string;
  submissionId: string;
  parentName: string;
  whatsappNumber: string;
  status: 'inquiry' | 'enrolled' | 'completed' | 'cancelled' | 'no_show';
  paymentStatus: 'unpaid' | 'partial' | 'full' | 'refunded';
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  enrollmentDate?: string;
  commissionEarned?: {
    totalCommission: number;
    currency: string;
  };
}

interface EnrollmentTableProps {
  isSuperAdmin: boolean;
}

export const EnrollmentTable = ({ isSuperAdmin }: EnrollmentTableProps) => {
  const isMobile = useIsMobile();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Enrollment>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [mpesaReference, setMpesaReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [entriesPerPage] = useState(25);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.request<{enrollments: Enrollment[], pagination?: { total: number, pages: number }}>(
        'GET',
        '/enrollments',
        undefined,
        {
          params: {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
            page: currentPage,
            limit: entriesPerPage
          }
        }
      );

      if (response.success && response.data) {
        const data = response.data as {enrollments: Enrollment[], pagination?: { total: number, pages: number }};
        setEnrollments(data.enrollments || []);
        if (data.pagination) {
          setTotalEntries(data.pagination.total || data.enrollments.length);
          setTotalPages(data.pagination.pages || 1);
        } else {
          // Fallback if pagination not returned
          setTotalEntries(data.enrollments.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, currentPage, entriesPerPage]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleEdit = (enrollment: Enrollment) => {
    setEditingId(enrollment._id);
    setEditData({ ...enrollment });
  };

  const handleSave = async (id: string) => {
    try {
      // Calculate pending amount if editing paid or total
      const updateData: Partial<Enrollment> = { ...editData };
      if (editData.totalAmount !== undefined || editData.paidAmount !== undefined) {
        const total = editData.totalAmount ?? (enrollments.find(e => e._id === id)?.totalAmount || 0);
        const paid = editData.paidAmount ?? (enrollments.find(e => e._id === id)?.paidAmount || 0);
        updateData.pendingAmount = Math.max(0, total - paid);
      }

      const response = await apiService.request(
        'PATCH',
        `/enrollments/${editData.submissionId}`,
        updateData
      );

      if (response.success) {
        toast.success('Enrollment updated successfully');
        setEditingId(null);
        fetchEnrollments();
      }
    } catch (error) {
      console.error('Failed to update enrollment:', error);
      toast.error('Failed to update enrollment');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleRecordPayment = async () => {
    if (!selectedEnrollment || !paymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }

    try {
      // Backend only accepts: amount, method, notes
      // Date and M-Pesa reference support coming in next backend update
      const paymentData = {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes || undefined
      };

      const response = await apiService.recordPayment(selectedEnrollment.submissionId, paymentData);

      if (response.success) {
        // Auto-enroll when payment is recorded
        await apiService.request(
          'PATCH',
          `/enrollments/${selectedEnrollment.submissionId}`,
          { status: 'enrolled' }
        );

        toast.success('Payment recorded and enrollment updated');
        setPaymentDialogOpen(false);
        setSelectedEnrollment(null);
        setPaymentAmount('');
        setPaymentMethod('cash');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setMpesaReference('');
        setPaymentNotes('');
        fetchEnrollments();
      } else {
        toast.error(response.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const openPaymentDialog = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setPaymentDialogOpen(true);
  };

  const filteredEnrollments = enrollments.filter(
    e =>
      e.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.whatsappNumber.includes(searchQuery)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Tracking</CardTitle>
        <CardDescription>
          Track parent enrollments, payments, and commission earned
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4'}`}>
          <Input
            placeholder="Search by name or WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="inquiry">Inquiry</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={(value) => {
            setPaymentFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Status</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchEnrollments} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent Name</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Total / Paid / Pending</TableHead>
                {isSuperAdmin && <TableHead>Commission</TableHead>}
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment._id}>
                  <TableCell className="font-medium">{enrollment.parentName}</TableCell>
                  <TableCell>{enrollment.whatsappNumber}</TableCell>
                  <TableCell>
                    {editingId === enrollment._id ? (
                      <Select
                        value={editData.status || enrollment.status}
                        onValueChange={(value: string) =>
                          setEditData({ ...editData, status: value as 'inquiry' | 'enrolled' | 'completed' | 'cancelled' | 'no_show' })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inquiry">Inquiry</SelectItem>
                          <SelectItem value="enrolled">Enrolled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="no_show">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {enrollment.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === enrollment._id ? (
                      <Select
                        value={editData.paymentStatus || enrollment.paymentStatus}
                        onValueChange={(value: string) =>
                          setEditData({ ...editData, paymentStatus: value as 'unpaid' | 'partial' | 'full' | 'refunded' })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          enrollment.paymentStatus === 'full'
                            ? 'bg-green-100 text-green-800'
                            : enrollment.paymentStatus === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {enrollment.paymentStatus}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === enrollment._id ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={editData.totalAmount ?? enrollment.totalAmount}
                          onChange={(e) =>
                            setEditData({ ...editData, totalAmount: parseFloat(e.target.value) })
                          }
                          className="w-20 text-xs"
                          placeholder="Total"
                        />
                        <Input
                          type="number"
                          value={editData.paidAmount ?? enrollment.paidAmount}
                          onChange={(e) =>
                            setEditData({ ...editData, paidAmount: parseFloat(e.target.value) })
                          }
                          className="w-20 text-xs"
                          placeholder="Paid"
                        />
                      </div>
                    ) : (
                      <span className="text-sm">
                        {enrollment.totalAmount} / {enrollment.paidAmount} / {enrollment.pendingAmount}
                      </span>
                    )}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-sm font-semibold text-green-700">
                      {enrollment.commissionEarned?.totalCommission
                        ? `${enrollment.commissionEarned.currency || 'KES'} ${enrollment.commissionEarned.totalCommission.toLocaleString()}`
                        : 'KES 0'}
                    </TableCell>
                  )}
                  <TableCell>
                    {editingId === enrollment._id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(enrollment._id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(enrollment)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Dialog open={paymentDialogOpen && selectedEnrollment?._id === enrollment._id} onOpenChange={(open) => {
                          if (!open) {
                            setPaymentDialogOpen(false);
                            setSelectedEnrollment(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openPaymentDialog(enrollment)}
                              className="gap-1"
                              disabled={enrollment.paymentStatus === 'full'}
                            >
                              <Plus className="h-4 w-4" />
                              Payment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                              <DialogTitle>Record Payment</DialogTitle>
                              <DialogDescription>
                                Record a payment for {enrollment.parentName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="payment-amount" className="text-sm font-medium">
                                  Amount
                                </Label>
                                <Input
                                  id="payment-amount"
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <Label htmlFor="payment-method" className="text-sm font-medium">
                                  Payment Method
                                </Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                  <SelectTrigger id="payment-method">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="payment-date" className="text-sm font-medium">
                                  Payment Date
                                </Label>
                                <Input
                                  id="payment-date"
                                  type="date"
                                  value={paymentDate}
                                  onChange={(e) => setPaymentDate(e.target.value)}
                                />
                              </div>
                              {paymentMethod === 'mpesa' && (
                                <div>
                                  <Label htmlFor="mpesa-ref" className="text-sm font-medium">
                                    M-Pesa Reference / Confirmation Code
                                  </Label>
                                  <Input
                                    id="mpesa-ref"
                                    type="text"
                                    value={mpesaReference}
                                    onChange={(e) => setMpesaReference(e.target.value)}
                                    placeholder="e.g., ABC123XYZ"
                                    className="uppercase"
                                  />
                                </div>
                              )}
                              <div>
                                <Label htmlFor="payment-notes" className="text-sm font-medium">
                                  Notes (optional)
                                </Label>
                                <Input
                                  id="payment-notes"
                                  type="text"
                                  value={paymentNotes}
                                  onChange={(e) => setPaymentNotes(e.target.value)}
                                  placeholder="Add any notes..."
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setPaymentDialogOpen(false);
                                  setSelectedEnrollment(null);
                                  setPaymentAmount('');
                                  setPaymentMethod('cash');
                                  setPaymentDate(new Date().toISOString().split('T')[0]);
                                  setMpesaReference('');
                                  setPaymentNotes('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleRecordPayment}>
                                Record Payment
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEnrollments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No enrollments found
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Showing {totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
              {Math.min(currentPage * entriesPerPage, totalEntries)} of {totalEntries} entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <p className="text-sm font-medium px-3 py-2">
                Page {currentPage} of {totalPages}
              </p>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
