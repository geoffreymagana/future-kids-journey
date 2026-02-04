import { Enrollment } from '@/models/Enrollment';
import { FormSubmission } from '@/models/FormSubmission';
import { PaymentTerms } from '@/models/PaymentTerms';
import { Attendance } from '@/models/Attendance';

export interface RevenueMetrics {
  totalSignups: number; // Form submissions that became enrollments
  totalReach: number; // All website visits (form submissions)
  totalEnrollments: number; // Active enrollments
  totalShowUps: number; // Workshop attendees (future: from attendance table)
  totalFullyPaid: number;
  totalPartiallyPaid: number;
  totalUnpaid: number;
  
  enrollmentRevenue: number; // Revenue from enrollment commitments
  attendanceRevenue: number; // Revenue from workshop attendance
  totalRevenue: number; // enrollmentRevenue + attendanceRevenue
  enrollmentCommissionTotal: number;
  attendanceCommissionTotal: number;
  
  breakdown: {
    byStatus: { [key: string]: { count: number; commission: number } };
    byPaymentStatus: { [key: string]: { count: number; totalAmount: number; paidAmount: number } };
    byAgeGroup: { [key: string]: { count: number; totalAmount: number } };
  };
  
  payoutInfo: {
    nextPayoutDate: Date;
    frequency: string;
    minimumAmount: number;
    pendingPayout: number;
  };
  
  paymentTerms: {
    enrollmentRate: number;
    attendanceRate: number;
    currency: string;
  };
}

/**
 * Calculate total revenue and commission metrics
 */
export const calculateRevenueMetrics = async (): Promise<RevenueMetrics> => {
  try {
    const [enrollments, formSubmissions, paymentTerms, attendances] = await Promise.all([
      Enrollment.find({}),
      FormSubmission.find({ isDuplicate: false }),
      PaymentTerms.findOne({ isActive: true }).sort({ effectiveFrom: -1 }),
      Attendance.find({ status: 'attended' })
    ]);

    // Default terms if none configured
    const terms = paymentTerms || {
      enrollmentCommissionRate: 25,
      attendanceCommissionRate: 15, // Was signupCommissionRate, now attendance
      currency: 'KES',
      payoutFrequency: 'monthly',
      payoutDay: 15,
      minimumPayoutAmount: 1000
    };

    const totalReach = formSubmissions.length; // All website visits
    const totalSignups = enrollments.length; // Form submissions that became enrollments
    let totalEnrollments = 0;
    const totalShowUps = attendances.length; // Workshop attendance from Attendance model
    let totalFullyPaid = 0;
    let totalPartiallyPaid = 0;
    let totalUnpaid = 0;

    let enrollmentRevenue = 0;
    let attendanceRevenue = 0;
    let enrollmentCommissionTotal = 0;
    let attendanceCommissionTotal = 0;

    const byStatus: { [key: string]: { count: number; commission: number } } = {};
    const byPaymentStatus: { [key: string]: { count: number; totalAmount: number; paidAmount: number } } = {
      full: { count: 0, totalAmount: 0, paidAmount: 0 },
      partial: { count: 0, totalAmount: 0, paidAmount: 0 },
      unpaid: { count: 0, totalAmount: 0, paidAmount: 0 },
      refunded: { count: 0, totalAmount: 0, paidAmount: 0 }
    };
    const byAgeGroup: { [key: string]: { count: number; totalAmount: number } } = {
      '5-7': { count: 0, totalAmount: 0 },
      '8-10': { count: 0, totalAmount: 0 },
      '11-14': { count: 0, totalAmount: 0 }
    };

    enrollments.forEach(enrollment => {
      // Status counting
      totalEnrollments++;
      
      if (!byStatus[enrollment.status]) {
        byStatus[enrollment.status] = { count: 0, commission: 0 };
      }
      byStatus[enrollment.status].count++;

      // Payment status counting
      if (byPaymentStatus[enrollment.paymentStatus]) {
        byPaymentStatus[enrollment.paymentStatus].count++;
        byPaymentStatus[enrollment.paymentStatus].totalAmount += enrollment.totalAmount;
        byPaymentStatus[enrollment.paymentStatus].paidAmount += enrollment.paidAmount;
      }

      // Age group counting
      byAgeGroup[enrollment.childAgeRange].count++;
      byAgeGroup[enrollment.childAgeRange].totalAmount += enrollment.totalAmount;

      // Enrollment commission - from enrollment commitment
      const enrollmentComm = enrollment.totalAmount * (terms.enrollmentCommissionRate / 100);
      enrollmentCommissionTotal += enrollmentComm;
      enrollmentRevenue += enrollmentComm;
      
      byStatus[enrollment.status].commission += enrollmentComm;

      // Payment status breakdown
      if (enrollment.paymentStatus === 'full') {
        totalFullyPaid++;
      } else if (enrollment.paymentStatus === 'partial') {
        totalPartiallyPaid++;
      } else if (enrollment.paymentStatus === 'unpaid') {
        totalUnpaid++;
      }
    });

    // Attendance commission - ONLY from actual attendance records (status='attended')
    // DO NOT count from enrollment or payment status to prevent double counting
    attendances.forEach(attendance => {
      const relatedEnrollment = enrollments.find(e => e._id.toString() === attendance.enrollmentId.toString());
      if (relatedEnrollment) {
        const attendanceComm = relatedEnrollment.totalAmount * (terms.attendanceCommissionRate / 100);
        attendanceCommissionTotal += attendanceComm;
        attendanceRevenue += attendanceComm;
      }
    });

    const totalRevenue = enrollmentRevenue + attendanceRevenue;

    // Calculate next payout date
    const today = new Date();
    const nextPayoutDate = new Date(today);
    
    if (terms.payoutFrequency === 'monthly') {
      nextPayoutDate.setDate(terms.payoutDay);
      if (nextPayoutDate <= today) {
        nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
      }
    } else if (terms.payoutFrequency === 'weekly') {
      const daysUntilPayoutDay = (terms.payoutDay - today.getDay() + 7) % 7 || 7;
      nextPayoutDate.setDate(today.getDate() + daysUntilPayoutDay);
    } else if (terms.payoutFrequency === 'biweekly') {
      nextPayoutDate.setDate(today.getDate() + 14);
    } else if (terms.payoutFrequency === 'quarterly') {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      nextPayoutDate.setMonth((currentQuarter + 1) * 3, 1);
    }

    return {
      totalReach,
      totalSignups,
      totalEnrollments,
      totalShowUps,
      totalFullyPaid,
      totalPartiallyPaid,
      totalUnpaid,
      enrollmentRevenue: Math.round(enrollmentRevenue * 100) / 100,
      attendanceRevenue: Math.round(attendanceRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      enrollmentCommissionTotal: Math.round(enrollmentCommissionTotal * 100) / 100,
      attendanceCommissionTotal: Math.round(attendanceCommissionTotal * 100) / 100,
      breakdown: {
        byStatus,
        byPaymentStatus,
        byAgeGroup
      },
      payoutInfo: {
        nextPayoutDate,
        frequency: terms.payoutFrequency,
        minimumAmount: terms.minimumPayoutAmount ?? 1000,
        pendingPayout: totalRevenue >= (terms.minimumPayoutAmount ?? 1000) ? totalRevenue : 0
      },
      paymentTerms: {
        enrollmentRate: terms.enrollmentCommissionRate,
        attendanceRate: terms.attendanceCommissionRate,
        currency: terms.currency
      }
    };
  } catch (error) {
    console.error('Revenue calculation error:', error);
    throw error;
  }
};

/**
 * Calculate commission for a single enrollment
 */
export const calculateCommission = (
  enrollmentAmount: number,
  enrollmentStatus: string,
  enrollmentRate: number,
  attendanceRate: number
): { enrollment: number; attendance: number; total: number } => {
  const enrollment = enrollmentAmount * (enrollmentRate / 100);
  const attendance = enrollmentAmount * (attendanceRate / 100);
  const total = enrollment + attendance;

  return {
    enrollment: Math.round(enrollment * 100) / 100,
    attendance: Math.round(attendance * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

/**
 * Get current active payment terms (create default if none exists)
 */
export const getActivePaymentTerms = async () => {
  let terms = await PaymentTerms.findOne({ isActive: true }).sort({ effectiveFrom: -1 });
  
  if (!terms) {
    // Create default payment terms if none exist
    terms = await PaymentTerms.create({
      signupCommissionRate: 15,
      enrollmentCommissionRate: 25,
      currency: 'KES',
      payoutFrequency: 'monthly',
      payoutDay: 15,
      minimumPayoutAmount: 1000,
      isActive: true,
      effectiveFrom: new Date(),
      updatedBy: 'system'
    });
  }
  
  return terms;
};
