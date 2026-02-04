import { useEffect, useState, useCallback } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface AttendanceRecord {
  _id: string;
  enrollmentId: {
    _id: string;
    parentName: string;
    whatsappNumber: string;
  };
  workshopDate: string;
  status: 'attended' | 'absent' | 'pending' | 'cancelled';
  recordedAt?: string;
}

interface AttendanceStats {
  attended: number;
  absent: number;
  pending: number;
  cancelled: number;
  total: number;
}

interface AttendanceResponse {
  attendances: AttendanceRecord[];
  pagination: {
    total: number;
    pages: number;
    limit: number;
  };
}

interface AttendanceStatsComponentProps {
  isSuperAdmin: boolean;
}

export const AttendanceStats = ({ isSuperAdmin }: AttendanceStatsComponentProps) => {
  const isMobile = useIsMobile();
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AttendanceStats>({
    attended: 0,
    absent: 0,
    pending: 0,
    cancelled: 0,
    total: 0
  });

  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [entriesPerPage] = useState(25);

  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.request<AttendanceResponse>(
        'GET',
        '/attendance',
        undefined,
        {
          params: {
            workshopDate: dateFilter || undefined,
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

        // Calculate stats from all records (not just current page)
        const allAttendances = response.data.attendances;
        const statsData: AttendanceStats = {
          attended: allAttendances.filter(a => a.status === 'attended').length,
          absent: allAttendances.filter(a => a.status === 'absent').length,
          pending: allAttendances.filter(a => a.status === 'pending').length,
          cancelled: allAttendances.filter(a => a.status === 'cancelled').length,
          total: response.data.pagination.total
        };
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter, currentPage, entriesPerPage]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchAttendances();
  }, [isSuperAdmin, fetchAttendances]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attended':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const filteredAttendances = attendances.filter(
    a =>
      a.enrollmentId.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.enrollmentId.whatsappNumber.includes(searchQuery)
  );

  const attendanceRate = stats.total > 0
    ? Math.round((stats.attended / stats.total) * 100)
    : 0;

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
              <p className="text-xs text-blue-600 mt-1">Total records</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Attended
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{stats.attended}</div>
              <p className="text-xs text-green-600 mt-1">{attendanceRate}% attended</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
              <p className="text-xs text-yellow-600 mt-1">Awaiting check-in</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Absent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">{stats.absent}</div>
              <p className="text-xs text-red-600 mt-1">No show</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">{stats.cancelled}</div>
              <p className="text-xs text-gray-600 mt-1">Cancelled</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>View and manage attendance records</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4'}`}>
            <div>
              <Label htmlFor="date-filter" className="text-sm mb-2 block">
                Workshop Date
              </Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div>
              <Label htmlFor="status-filter" className="text-sm mb-2 block">
                Status
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="attended">Attended</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search" className="text-sm mb-2 block">
                Search
              </Label>
              <Input
                id="search"
                placeholder="Parent name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchAttendances}
                disabled={loading}
                className="w-full gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
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
                  <TableHead>Recorded At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendances.map((attendance) => (
                  <TableRow key={attendance._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {attendance.enrollmentId.parentName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {attendance.enrollmentId.whatsappNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(attendance.workshopDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(attendance.status)}
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                            attendance.status
                          )}`}
                        >
                          {attendance.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {attendance.recordedAt
                        ? new Date(attendance.recordedAt).toLocaleString()
                        : '-'}
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
            {totalPages > 1 && (
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
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
