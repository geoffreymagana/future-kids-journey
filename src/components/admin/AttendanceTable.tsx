import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Edit2, Save, X, Plus, QrCode, Trash2, AlertCircle } from 'lucide-react';

interface Attendance {
  _id: string;
  enrollmentId: {
    _id: string;
    parentName: string;
    whatsappNumber: string;
  };
  submissionId: string;
  workshopDate: string;
  attendanceDate?: string;
  qrCode: string;
  status: 'pending' | 'attended' | 'absent' | 'cancelled';
  notes?: string;
  recordedBy?: string;
  recordedAt?: string;
}

interface AttendanceResponse {
  attendances: Attendance[];
  pagination: {
    total: number;
    pages: number;
    limit: number;
  };
}

interface AttendanceTableProps {
  isSuperAdmin: boolean;
}

export const AttendanceTable = ({ isSuperAdmin }: AttendanceTableProps) => {
  const isMobile = useIsMobile();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [entriesPerPage] = useState(25);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Attendance>>({});
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newAttendance, setNewAttendance] = useState<{
    enrollmentId: string;
    workshopDate: string;
    status: 'pending' | 'attended' | 'absent' | 'cancelled';
    attendanceDate: string;
    notes: string;
  }>({
    enrollmentId: '',
    workshopDate: new Date().toISOString().split('T')[0],
    status: 'attended',
    attendanceDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.request<AttendanceResponse>(
        'GET',
        '/attendance',
        undefined,
        {
          params: {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            page: currentPage,
            limit: entriesPerPage
          }
        }
      );

      if (response.success && response.data) {
        setAttendances(response.data.attendances);
        setTotalEntries(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage, entriesPerPage]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchAttendances();
  }, [isSuperAdmin, fetchAttendances]);

  const handleEdit = (attendance: Attendance) => {
    setEditingId(attendance._id);
    setEditData({ ...attendance });
  };

  const handleSave = async (id: string) => {
    try {
      const response = await apiService.request(
        'PATCH',
        `/attendance/${id}`,
        {
          status: editData.status,
          attendanceDate: editData.attendanceDate,
          notes: editData.notes
        }
      );

      if (response.success) {
        toast.success('Attendance updated');
        setEditingId(null);
        fetchAttendances();
      }
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update attendance');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleAddAttendance = async () => {
    if (!newAttendance.enrollmentId) {
      toast.error('Please select an enrollment');
      return;
    }

    try {
      const response = await apiService.request(
        'POST',
        '/attendance',
        {
          enrollmentId: newAttendance.enrollmentId,
          workshopDate: newAttendance.workshopDate,
          status: newAttendance.status,
          attendanceDate: newAttendance.attendanceDate,
          notes: newAttendance.notes
        }
      );

      if (response.success) {
        toast.success('Attendance recorded');
        setAddDialogOpen(false);
        setNewAttendance({
          enrollmentId: '',
          workshopDate: new Date().toISOString().split('T')[0],
          status: 'attended',
          attendanceDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setCurrentPage(1);
        fetchAttendances();
      }
    } catch (error) {
      console.error('Failed to add attendance:', error);
      toast.error('Failed to record attendance');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.request('DELETE', `/attendance/${id}`);
      if (response.success) {
        toast.success('Attendance deleted');
        setDeleteConfirmId(null);
        fetchAttendances();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete attendance');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAttendances = attendances.filter(
    a =>
      a.enrollmentId.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.enrollmentId.whatsappNumber.includes(searchQuery) ||
      a.qrCode.includes(searchQuery.toUpperCase())
  );

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Workshop Attendance</CardTitle>
          <CardDescription>
            Record and track workshop attendance
          </CardDescription>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Record Attendance
        </Button>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          <Input
            placeholder="Search by parent name, phone, or QR code..."
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
              <SelectItem value="attended">Attended</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchAttendances} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Parent Name</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Workshop Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendances.map((attendance) => (
                <TableRow key={attendance._id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {editingId === attendance._id ? (
                      <Input
                        disabled
                        value={attendance.enrollmentId.parentName}
                        className="w-full"
                      />
                    ) : (
                      attendance.enrollmentId.parentName
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === attendance._id ? (
                      <Input
                        disabled
                        value={attendance.enrollmentId.whatsappNumber}
                        className="w-full"
                      />
                    ) : (
                      attendance.enrollmentId.whatsappNumber
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === attendance._id ? (
                      <Input
                        type="date"
                        value={(editData.workshopDate as string | undefined)?.split('T')[0] || ''}
                        onChange={(e) =>
                          setEditData({ ...editData, workshopDate: e.target.value })
                        }
                        className="w-full"
                      />
                    ) : (
                      new Date(attendance.workshopDate).toLocaleDateString()
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === attendance._id ? (
                      <Select
                        value={editData.status || 'attended'}
                        onValueChange={(value: 'pending' | 'attended' | 'absent' | 'cancelled') =>
                          setEditData({
                            ...editData,
                            status: value
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attended">Attended</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                          attendance.status
                        )}`}
                      >
                        {attendance.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{attendance.qrCode}</TableCell>
                  <TableCell>
                    {editingId === attendance._id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(attendance._id)}
                          className="gap-1"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(attendance)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirmId(attendance._id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAttendances.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No attendance records found
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

      {/* Add Attendance Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Workshop Attendance</DialogTitle>
            <DialogDescription>
              Add attendance record for a parent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="enrollment-select">Select Enrollment</Label>
              <Input
                id="enrollment-select"
                placeholder="Enrollment ID"
                value={newAttendance.enrollmentId}
                onChange={(e) =>
                  setNewAttendance({
                    ...newAttendance,
                    enrollmentId: e.target.value
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the enrollment ID from the enrollment table
              </p>
            </div>

            <div>
              <Label htmlFor="workshop-date">Workshop Date</Label>
              <Input
                id="workshop-date"
                type="date"
                value={newAttendance.workshopDate}
                onChange={(e) =>
                  setNewAttendance({
                    ...newAttendance,
                    workshopDate: e.target.value
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="attendance-date">Attendance Date</Label>
              <Input
                id="attendance-date"
                type="date"
                value={newAttendance.attendanceDate}
                onChange={(e) =>
                  setNewAttendance({
                    ...newAttendance,
                    attendanceDate: e.target.value
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="status-select">Status</Label>
              <Select
                value={newAttendance.status}
                onValueChange={(value: 'pending' | 'attended' | 'absent' | 'cancelled') =>
                  setNewAttendance({
                    ...newAttendance,
                    status: value
                  })
                }
              >
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attended">Attended</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Any notes about attendance..."
                value={newAttendance.notes}
                onChange={(e) =>
                  setNewAttendance({
                    ...newAttendance,
                    notes: e.target.value
                  })
                }
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAttendance}>Record</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Attendance Record
              </DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this attendance record? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};
