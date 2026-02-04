import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiService, ActivityLog } from '@/services/api';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ActivityLogsProps {
  isSuperAdmin: boolean;
}

interface Pagination {
  pages: number;
  total: number;
}

export const ActivityLogs = ({ isSuperAdmin }: ActivityLogsProps) => {
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ pages: 1, total: 0 });
  const [entriesPerPage] = useState(25);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getActivityLogs({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        resource: resourceFilter !== 'all' ? resourceFilter : undefined,
        page: currentPage,
        limit: entriesPerPage,
      });

      if (response.success && response.data) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, resourceFilter, currentPage, entriesPerPage]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchLogs();
  }, [isSuperAdmin, fetchLogs]);

  const getStatusIcon = (status: string) => {
    if (status === 'success') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Audit Trail</CardTitle>
        <CardDescription>
          Track all administrative actions and system events
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={resourceFilter} onValueChange={(value) => {
            setResourceFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="enrollment">Enrollment</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="submission">Submission</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchLogs} disabled={loading} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log._id} className="hover:bg-gray-50">
                  <TableCell className="text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {log.adminEmail || 'System'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      {log.resource}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {log.status === 'error' && log.errorMessage ? (
                      <span title={log.errorMessage} className="text-red-600 truncate">
                        {log.errorMessage.substring(0, 40)}...
                      </span>
                    ) : log.resourceId ? (
                      <span className="text-gray-500 text-xs">{log.resourceId.substring(0, 12)}...</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No activity logs found
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
          <p className="text-sm text-gray-600">
            Showing {pagination.total === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
            {Math.min(currentPage * entriesPerPage, pagination.total)} of {pagination.total} entries
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
              Page {currentPage} of {pagination.pages}
            </p>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage === pagination.pages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
