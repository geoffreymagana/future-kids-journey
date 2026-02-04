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
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorLogsProps {
  isSuperAdmin: boolean;
}

interface Pagination {
  pages: number;
  total: number;
}

export const ErrorLogs = ({ isSuperAdmin }: ErrorLogsProps) => {
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ pages: 1, total: 0 });
  const [entriesPerPage] = useState(25);

  const fetchErrorLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.request('GET', '/admin/error-logs', undefined, {
        params: {
          action: actionFilter !== 'all' ? actionFilter : undefined,
          resource: resourceFilter !== 'all' ? resourceFilter : undefined,
          page: currentPage,
          limit: entriesPerPage,
        },
      });

      if (response.success && response.data) {
        const data = response.data as { logs: ActivityLog[]; pagination: Pagination };
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
      toast.error('Failed to load error logs');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, resourceFilter, currentPage, entriesPerPage]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchErrorLogs();
  }, [isSuperAdmin, fetchErrorLogs]);

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Error Logs
        </CardTitle>
        <CardDescription>
          Track all failed operations and system errors
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          <Select value={actionFilter} onValueChange={(value) => {
            setActionFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create_enrollment">Create Enrollment</SelectItem>
              <SelectItem value="record_payment">Record Payment</SelectItem>
              <SelectItem value="update_enrollment">Update Enrollment</SelectItem>
              <SelectItem value="delete_submission">Delete Submission</SelectItem>
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
            </SelectContent>
          </Select>

          <Button onClick={fetchErrorLogs} disabled={loading} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-red-50">
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Error Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log._id} className="hover:bg-red-50">
                  <TableCell className="text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {log.adminEmail || 'System'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                      {log.resource}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-red-600">
                    <span title={log.errorMessage} className="truncate block max-w-xs">
                      {log.errorMessage || 'Unknown error'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No error logs found
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
