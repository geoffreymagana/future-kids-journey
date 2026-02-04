import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Share2,
  TrendingUp,
  UserPlus,
  LogOut,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface OverviewData {
  totalParents: number;
  totalShares: number;
  recentParents: number;
  recentShares: number;
  totalReferrals: number;
  conversionRate: string;
}

interface Submission {
  id: string;
  name: string;
  whatsapp: string;
  age_range: string;
  referral_id: string;
  referred_by: string | null;
  created_at: string;
}

interface SubmissionsData {
  submissions: Submission[];
  total: number;
  page: number;
  totalPages: number;
}

interface SharesData {
  platformBreakdown: { platform: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

interface ReferralsData {
  topReferrers: { referralId: string; count: number }[];
  ageDistribution: { range: string; count: number }[];
}

const COLORS = ['hsl(149, 94%, 47%)', 'hsl(258, 100%, 78%)', 'hsl(210, 78%, 40%)', '#FFBC4B'];

const AdminDashboard = () => {
  const { admin, logout, isLoading: authLoading } = useAdminAuth();
  const { isLoading, fetchOverview, fetchSubmissions, fetchShares, fetchReferrals } = useAdminData();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionsData | null>(null);
  const [shares, setShares] = useState<SharesData | null>(null);
  const [referrals, setReferrals] = useState<ReferralsData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'analytics'>('overview');

  useEffect(() => {
    if (!authLoading && !admin) {
      navigate('/admin');
    }
  }, [admin, authLoading, navigate]);

  useEffect(() => {
    if (admin) {
      loadData();
    }
  }, [admin]);

  const loadData = async () => {
    const [overviewData, submissionsData, sharesData, referralsData] = await Promise.all([
      fetchOverview(),
      fetchSubmissions(currentPage),
      fetchShares(),
      fetchReferrals(),
    ]);

    if (overviewData) setOverview(overviewData);
    if (submissionsData) setSubmissions(submissionsData);
    if (sharesData) setShares(sharesData);
    if (referralsData) setReferrals(referralsData);
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    const data = await fetchSubmissions(page);
    if (data) setSubmissions(data);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-soft-navy text-background py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Future-Ready Kids Admin</h1>
            <p className="text-sm text-background/70">Welcome, {admin.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="text-background hover:bg-background/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-background hover:bg-background/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 border-b border-border">
          {(['overview', 'submissions', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        {activeTab === 'overview' && overview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overview.totalParents}</p>
                      <p className="text-xs text-muted-foreground">Total Parents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-soft-purple/10 rounded-lg flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-soft-purple" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overview.totalShares}</p>
                      <p className="text-xs text-muted-foreground">Total Shares</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overview.recentParents}</p>
                      <p className="text-xs text-muted-foreground">Last 7 Days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-soft-purple/10 rounded-lg flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-soft-purple" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overview.recentShares}</p>
                      <p className="text-xs text-muted-foreground">Recent Shares</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overview.totalReferrals}</p>
                      <p className="text-xs text-muted-foreground">Referrals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-soft-purple/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-soft-purple" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overview.conversionRate}%</p>
                      <p className="text-xs text-muted-foreground">Conversion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {shares && shares.dailyTrend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Share Trend (14 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={shares.dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          fontSize={12}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(149, 94%, 47%)" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(149, 94%, 47%)' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {referrals && referrals.ageDistribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Age Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={referrals.ageDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="range"
                          label={({ range, count }) => `${range}: ${count}`}
                        >
                          {referrals.ageDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'submissions' && submissions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Parent Submissions ({submissions.total} total)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Age Range</TableHead>
                        <TableHead>Referral ID</TableHead>
                        <TableHead>Referred By</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.submissions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.name}</TableCell>
                          <TableCell>{sub.whatsapp}</TableCell>
                          <TableCell>{sub.age_range}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{sub.referral_id}</code>
                          </TableCell>
                          <TableCell>
                            {sub.referred_by ? (
                              <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {sub.referred_by}
                              </code>
                            ) : (
                              <span className="text-muted-foreground">Direct</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {submissions.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {submissions.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === submissions.totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Platform Breakdown */}
            {shares && shares.platformBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Share Platform Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={shares.platformBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="platform" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(149, 94%, 47%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top Referrers */}
            {referrals && referrals.topReferrers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Referrers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referrals.topReferrers.map((referrer, index) => (
                      <div
                        key={referrer.referralId}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </span>
                          <code className="text-sm">{referrer.referralId}</code>
                        </div>
                        <span className="font-bold text-primary">{referrer.count} referrals</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
