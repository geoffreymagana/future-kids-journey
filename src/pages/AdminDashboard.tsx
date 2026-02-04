import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RevenueCard } from '@/components/admin/RevenueCard';
import { ShareMetricsCard } from '@/components/admin/ShareMetricsCard';
import { EnrollmentTable } from '@/components/admin/EnrollmentTable';
import { AttendanceTable } from '@/components/admin/AttendanceTable';
import { AttendanceStats } from '@/components/admin/AttendanceStats';
import { PaymentTermsPanel } from '@/components/admin/PaymentTermsPanel';
import { ActivityLogs } from '@/components/admin/ActivityLogs';
import { ErrorLogs } from '@/components/admin/ErrorLogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Users, TrendingUp, Clock, Trash2, Download, FileText, Plus, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { utils as XLSXUtils, writeFile } from 'xlsx';
import type { jsPDF as jsPDFType } from 'jspdf';

interface Submission {
  _id: string;
  parentName: string;
  whatsappNumber: string;
  childAgeRange: string;
  status: 'new' | 'contacted' | 'enrolled' | 'no_response';
  submittedAt: string;
  source?: string;
  sharedTo?: string[];
  isDuplicate?: boolean;
  duplicateOf?: string;
  hasDuplicates?: boolean;
  duplicateSubmissions?: string[];
  numberOfKids?: number;
}

interface Stats {
  totalSubmissions: number;
  byStatus: Array<{ _id: string; count: number }>;
  byAgeRange: Array<{ _id: string; count: number }>;
  bySource?: Array<{ _id: string; count: number }>;
  bySharedTo?: Array<{ _id: string; count: number }>;
  recentSubmissions: Submission[];
}

interface SubmissionData {
  submissions: Submission[];
  pagination: {
    pages: number;
    total: number;
    limit: number;
  };
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<Stats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ageRangeFilter, setAgeRangeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [entriesPerPage] = useState(25);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [adminRole, setAdminRole] = useState<string>('');
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [enrollmentAmount, setEnrollmentAmount] = useState('0');
  const [enrollmentNotes, setEnrollmentNotes] = useState('');
  const [enrollmentStatusMap, setEnrollmentStatusMap] = useState<Record<string, boolean>>({}); // Track which submissions are enrolled
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [numberOfKidsFilter, setNumberOfKidsFilter] = useState('');

  // Check authentication and get admin role from JWT token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      // No token, redirect to login
      navigate('/admin/login');
      return;
    }

    const role = apiService.getAdminRole();
    if (role) {
      setAdminRole(role);
    } else {
      // Invalid token, redirect to login
      localStorage.removeItem('authToken');
      navigate('/admin/login');
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResponse, submissionsResponse] = await Promise.all([
        apiService.getStats(),
        apiService.getSubmissions(
          {
            status: statusFilter || undefined,
            ageRange: ageRangeFilter || undefined,
            page: currentPage,
            limit: entriesPerPage
          },
          '-submittedAt'
        )
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data as Stats);
      }

      if (submissionsResponse.success && submissionsResponse.data) {
        const data = submissionsResponse.data as SubmissionData;
        let filtered = data.submissions;

        if (searchQuery) {
          filtered = filtered.filter(
            (sub: Submission) =>
              sub.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sub.whatsappNumber.includes(searchQuery)
          );
        }

        if (sourceFilter) {
          filtered = filtered.filter(
            (sub: Submission) =>
              sub.source && sub.source.toLowerCase() === sourceFilter.toLowerCase()
          );
        }

        if (numberOfKidsFilter) {
          const kidsNum = parseInt(numberOfKidsFilter, 10);
          filtered = filtered.filter(
            (sub: Submission) => sub.numberOfKids === kidsNum
          );
        }

        setSubmissions(filtered);
        setTotalPages(data.pagination.pages);
        setTotalEntries(data.pagination.total);

        // Check enrollment status for all submissions
        const enrollmentStatusMap: Record<string, boolean> = {};
        for (const submission of filtered) {
          try {
            const enrollmentResponse = await apiService.getEnrollment(submission._id);
            enrollmentStatusMap[submission._id] = enrollmentResponse.success && !!enrollmentResponse.data;
          } catch (error) {
            // Enrollment doesn't exist, which is fine
            enrollmentStatusMap[submission._id] = false;
          }
        }
        setEnrollmentStatusMap(enrollmentStatusMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, ageRangeFilter, currentPage, searchQuery, sourceFilter, numberOfKidsFilter, entriesPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const response = await apiService.updateSubmission(submissionId, {
        status: newStatus
      });

      if (response.success) {
        toast.success('Status updated');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleCreateEnrollment = async () => {
    if (!selectedSubmission) return;

    try {
      // First check if enrollment already exists for this submission
      try {
        const checkResponse = await apiService.getEnrollment(selectedSubmission._id);
        
        if (checkResponse.success && checkResponse.data) {
          toast.error('An enrollment already exists for this submission');
          setEnrollmentDialogOpen(false);
          return;
        }
      } catch (checkError) {
        // 404 means no enrollment exists, which is what we want
        console.debug('No existing enrollment found (expected 404)');
      }

      // Create new enrollment
      const response = await apiService.createEnrollment({
        submissionId: selectedSubmission._id,
        parentName: selectedSubmission.parentName,
        whatsappNumber: selectedSubmission.whatsappNumber,
        childAgeRange: selectedSubmission.childAgeRange,
        totalAmount: enrollmentAmount ? parseFloat(enrollmentAmount) : 0,
        notes: enrollmentNotes || undefined
      });

      if (response.success) {
        toast.success('Enrollment created successfully');
        setEnrollmentDialogOpen(false);
        setSelectedSubmission(null);
        setEnrollmentAmount('0');
        setEnrollmentNotes('');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to create enrollment');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create enrollment';
      
      // Handle enrollment already exists error
      if (message.includes('already exists')) {
        toast.error('An enrollment already exists for this submission');
      } else {
        console.error('Error creating enrollment:', error);
        toast.error(message);
      }
    }
  };

  const openEnrollmentDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEnrollmentDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'enrolled':
        return 'bg-green-100 text-green-800';
      case 'no_response':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(submissions.map(s => s._id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedItems).map(id =>
          apiService.updateSubmission(id, { status: newStatus })
        )
      );
      toast.success(`Updated ${selectedItems.size} items`);
      setSelectedItems(new Set());
      fetchData();
    } catch (error) {
      toast.error('Failed to update items');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    // Open confirmation dialog instead of using window.confirm
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteConfirmOpen(false);
    
    try {
      // Delete all selected items - backend handles cleanup of duplicates
      await Promise.all(
        Array.from(selectedItems).map(id =>
          apiService.deleteSubmission(id)
        )
      );
      toast.success(`Deleted ${selectedItems.size} items`);
      setSelectedItems(new Set());
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete items');
    }
  };

  const handleExcelExport = () => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const selectedSubmissions = submissions.filter(sub => selectedItems.has(sub._id));
      
      const data = selectedSubmissions.map(sub => ({
        'Parent Name': sub.parentName,
        'WhatsApp Number': sub.whatsappNumber,
        'Child Age Range': sub.childAgeRange,
        'Source': sub.source ? sub.source.replace('_', ' ').toUpperCase() : '-',
        'Shared To': sub.sharedTo && sub.sharedTo.length > 0 
          ? sub.sharedTo.map(p => p === 'copy_link' ? 'Link' : p.toUpperCase()).join(', ')
          : '-',
        'Status': sub.status.replace('_', ' ').toUpperCase(),
        'Submitted Date': new Date(sub.submittedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }));

      const workbook = XLSXUtils.book_new();
      const worksheet = XLSXUtils.json_to_sheet(data);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 }
      ];

      XLSXUtils.book_append_sheet(workbook, worksheet, 'Submissions');
      writeFile(workbook, `submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel file');
    }
  };

  const handlePDFExport = () => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const selectedSubmissions = submissions.filter(sub => selectedItems.has(sub._id));
      
      // Create PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      doc.setFontSize(16);
      doc.text('Parent Submissions Report', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 25);

      // Create simple text-based table
      doc.setFontSize(9);
      let yPosition = 35;
      const lineHeight = 6;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;

      // Column widths (approximate)
      const colWidths = {
        name: 35,
        phone: 30,
        age: 20,
        source: 25,
        shared: 30,
        status: 20,
        date: 25
      };

      // Add header row
      doc.setFont(undefined, 'bold');
      doc.setFillColor(29, 78, 137);
      doc.setTextColor(255, 255, 255);
      
      const headers = ['Parent Name', 'WhatsApp', 'Age', 'Source', 'Shared To', 'Status', 'Date'];
      let xPos = margin;
      headers.forEach((header, idx) => {
        const widths = [colWidths.name, colWidths.phone, colWidths.age, colWidths.source, colWidths.shared, colWidths.status, colWidths.date];
        doc.text(header, xPos + 1, yPosition, { maxWidth: widths[idx] - 2 });
        xPos += widths[idx];
      });
      
      yPosition += lineHeight + 2;

      // Add data rows
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      
      selectedSubmissions.forEach((sub, rowIdx) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Alternate row colors
        if (rowIdx % 2 === 0) {
          doc.setFillColor(240, 245, 250);
          doc.rect(margin, yPosition - lineHeight + 1, pageWidth - 2 * margin, lineHeight + 1, 'F');
        }

        xPos = margin;
        const rowData = [
          sub.parentName.substring(0, 25),
          sub.whatsappNumber.substring(0, 15),
          sub.childAgeRange,
          (sub.source || '-').replace('_', ' ').toUpperCase().substring(0, 15),
          (sub.sharedTo && sub.sharedTo.length > 0 
            ? sub.sharedTo.slice(0, 2).join(', ').substring(0, 20)
            : '-'),
          sub.status.replace('_', ' ').toUpperCase().substring(0, 12),
          new Date(sub.submittedAt).toLocaleDateString('en-US', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit'
          })
        ];
        
        const widths = [colWidths.name, colWidths.phone, colWidths.age, colWidths.source, colWidths.shared, colWidths.status, colWidths.date];
        rowData.forEach((cell, idx) => {
          doc.text(String(cell), xPos + 1, yPosition, { maxWidth: widths[idx] - 2 });
          xPos += widths[idx];
        });

        yPosition += lineHeight + 1;
      });

      // Save PDF
      doc.save(`submissions_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF file exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF file');
    }
  };

  const getTopSource = () => {
    if (!stats?.bySource || stats.bySource.length === 0) return 'N/A';
    const top = [...stats.bySource].sort((a, b) => b.count - a.count)[0];
    return (top?._id || 'N/A').toUpperCase();
  };

  const getTopSharedPlatform = () => {
    if (!stats?.bySharedTo || stats.bySharedTo.length === 0) return 'N/A';
    const top = [...stats.bySharedTo].sort((a, b) => b.count - a.count)[0];
    const platform = top?._id || 'N/A';
    return platform === 'copy_link' ? 'LINK' : platform.toUpperCase();
  };

  const statCards = [
    {
      icon: Users,
      label: 'Total Submissions',
      value: stats?.totalSubmissions || 0,
      color: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      label: 'New Leads',
      value: (stats?.byStatus || []).find((s) => s._id === 'new')?.count || 0,
      color: 'text-green-600'
    },
    {
      icon: Clock,
      label: 'Contacted',
      value: (stats?.byStatus || []).find((s) => s._id === 'contacted')?.count || 0,
      color: 'text-yellow-600'
    },
    {
      icon: TrendingUp,
      label: 'Top Source',
      value: getTopSource(),
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      label: 'Most Shared',
      value: getTopSharedPlatform(),
      color: 'text-pink-600'
    }
  ];

  return (
    <AdminLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className={`grid gap-6 mb-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'}`}>
            {statCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <card.icon className={`w-12 h-12 ${card.color} opacity-20`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Superadmin Dashboard - Revenue & Metrics */}
          {adminRole === 'super_admin' && (
            <>
              {/* Revenue Card */}
              <RevenueCard isSuperAdmin={true} />

              <div className="mb-8" />

              {/* Share Metrics */}
              <ShareMetricsCard isSuperAdmin={true} />

              <div className="mb-8" />
            </>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4 lg:grid-cols-6'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by name or number
              </label>
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range
              </label>
              <Select value={ageRangeFilter || 'all'} onValueChange={(value) => setAgeRangeFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All ages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ages</SelectItem>
                  <SelectItem value="5-7">5-7 years</SelectItem>
                  <SelectItem value="8-10">8-10 years</SelectItem>
                  <SelectItem value="11-14">11-14 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                # of Kids
              </label>
              <Select value={numberOfKidsFilter || 'all'} onValueChange={(value) => {
                setNumberOfKidsFilter(value === 'all' ? '' : value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={String(num)}>{num} kid{num !== 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <Select value={sourceFilter || 'all'} onValueChange={(value) => setSourceFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="reddit">Reddit</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchData} className="w-full h-10">
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Batch Actions */}
        {selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex flex-wrap gap-2 items-center justify-between"
          >
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.size} item(s) selected
            </span>
            <div className="flex gap-2 flex-wrap items-center">
              <Select onValueChange={handleBatchStatusChange}>
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Mark as New</SelectItem>
                  <SelectItem value="contacted">Mark as Contacted</SelectItem>
                  <SelectItem value="enrolled">Mark as Enrolled</SelectItem>
                  <SelectItem value="no_response">Mark as No Response</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Export Section with 2.75rem spacing */}
              <div style={{ marginLeft: '2.75rem' }} className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExcelExport}
                  className="flex items-center gap-1"
                  title="Export as Excel"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePDFExport}
                  className="flex items-center gap-1"
                  title="Export as PDF"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                className="flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItems(new Set())}
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedItems.size} item(s)? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Submissions Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No submissions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.size > 0 && selectedItems.size === submissions.length}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Parent Name</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">WhatsApp Number</TableHead>
                    <TableHead className="font-semibold">Age Range</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell"># Kids</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Submitted Date</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Source</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Shared To</TableHead>
                    <TableHead className="font-semibold text-center">Duplicate</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission._id} className="hover:bg-gray-50">
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selectedItems.has(submission._id)}
                          onCheckedChange={(checked) => handleSelectItem(submission._id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 text-sm">
                        <div>{submission.parentName}</div>
                        <div className="text-xs text-gray-500 md:hidden">{submission.whatsappNumber}</div>
                      </TableCell>
                      <TableCell className="text-gray-600 hidden md:table-cell">
                        {submission.whatsappNumber}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {submission.childAgeRange} years
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm hidden sm:table-cell font-medium">
                        {submission.numberOfKids || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 text-xs hidden md:table-cell">
                        {submission.submittedAt 
                          ? new Date(submission.submittedAt).toLocaleDateString('en-US', { 
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm hidden lg:table-cell">
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {submission.source ? submission.source.replace('_', ' ').toUpperCase() : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm hidden lg:table-cell">
                        {submission.sharedTo && submission.sharedTo.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {submission.sharedTo.map((platform) => (
                              <span key={platform} className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                {platform === 'copy_link' ? 'Link' : platform.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Not shared</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {submission.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium" title="This is a duplicate submission">
                            <span>🔄</span>
                            Duplicate
                          </span>
                        ) : submission.hasDuplicates && submission.duplicateSubmissions && submission.duplicateSubmissions.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-300 rounded text-xs font-medium" title={`This submission has ${submission.duplicateSubmissions.length} duplicate(s)`}>
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-red-700 font-bold">+{submission.duplicateSubmissions.length}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={submission.status}
                          onValueChange={(newStatus) =>
                            handleStatusChange(submission._id, newStatus)
                          }
                        >
                          <SelectTrigger className={`w-32 h-8 text-xs ${getStatusColor(submission.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="enrolled">Enrolled</SelectItem>
                            <SelectItem value="no_response">No Response</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        {submission.status === 'enrolled' && !enrollmentStatusMap[submission._id] && (
                          <Dialog open={enrollmentDialogOpen && selectedSubmission?._id === submission._id} onOpenChange={(open) => {
                            if (!open) {
                              setEnrollmentDialogOpen(false);
                              setSelectedSubmission(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEnrollmentDialog(submission)}
                                className="gap-1"
                              >
                                <Plus className="w-4 h-4" />
                                Enroll
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px]">
                              <DialogHeader>
                                <DialogTitle>Create Enrollment</DialogTitle>
                                <DialogDescription>
                                  Create an enrollment record for {submission.parentName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="enrollment-amount" className="text-sm font-medium">
                                    Total Amount
                                  </Label>
                                  <Input
                                    id="enrollment-amount"
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={enrollmentAmount}
                                    onChange={(e) => setEnrollmentAmount(e.target.value)}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="enrollment-notes" className="text-sm font-medium">
                                    Notes (optional)
                                  </Label>
                                  <Input
                                    id="enrollment-notes"
                                    type="text"
                                    value={enrollmentNotes}
                                    onChange={(e) => setEnrollmentNotes(e.target.value)}
                                    placeholder="Add any notes..."
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEnrollmentDialogOpen(false);
                                    setSelectedSubmission(null);
                                    setEnrollmentAmount('0');
                                    setEnrollmentNotes('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleCreateEnrollment}>
                                  Create Enrollment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {submission.status === 'enrolled' && enrollmentStatusMap[submission._id] && (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            ✓ Enrolled
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                <p>
                  Showing <span className="font-semibold">{submissions.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0}</span>
                  {' '}to{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * entriesPerPage, totalEntries)}
                  </span>
                  {' '}of{' '}
                  <span className="font-semibold">{totalEntries}</span> entries
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Admin Tables Section - Available to all admins */}
        <>
          <div className="mb-8" />

          {/* Attendance Statistics & Records */}
          <AttendanceStats isSuperAdmin={adminRole === 'super_admin'} />

          <div className="mb-8" />

          {/* Workshop Attendance */}
          <AttendanceTable isSuperAdmin={adminRole === 'super_admin'} />
        </>

        {/* Superadmin Tables Section */}
        {adminRole === 'super_admin' && (
          <>
            <div className="mb-8" />

            {/* Enrollment Tracking */}
            <EnrollmentTable isSuperAdmin={true} />

            <div className="mb-8" />

            {/* Payment Terms Setup */}
            <PaymentTermsPanel isSuperAdmin={true} />

            <div className="mb-8" />

            {/* Activity Logs / Audit Trail */}
            <ActivityLogs isSuperAdmin={true} />

            <div className="mb-8" />

            {/* Error Logs / Failed Operations */}
            <ErrorLogs isSuperAdmin={true} />
          </>
        )}
        </div>
      </div>
    </AdminLayout>
  );
};
