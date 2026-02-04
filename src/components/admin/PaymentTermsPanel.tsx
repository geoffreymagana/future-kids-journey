import { useEffect, useState } from 'react';
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
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Save, RefreshCw } from 'lucide-react';

interface PaymentTerms {
  _id?: string;
  signupCommissionRate: number; // Deprecated, use attendanceCommissionRate
  attendanceCommissionRate: number;
  enrollmentCommissionRate: number;
  eventTicketValue: number;
  currency: string;
  minimumPayoutAmount?: number | null;
  payoutFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  payoutDay: number;
  taxRate?: number | null;
  includesTax: boolean;
  notes?: string;
  isActive?: boolean;
  effectiveFrom?: string;
  updatedAt?: string;
}

interface PaymentTermsProps {
  isSuperAdmin: boolean;
}

export const PaymentTermsPanel = ({ isSuperAdmin }: PaymentTermsProps) => {
  const isMobile = useIsMobile();
  const [terms, setTerms] = useState<PaymentTerms | null>(null);
  const [editedTerms, setEditedTerms] = useState<PaymentTerms | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchPaymentTerms();
  }, [isSuperAdmin]);

  const fetchPaymentTerms = async () => {
    setLoading(true);
    try {
      const response = await apiService.request('GET', '/enrollments/revenue/terms');
      if (response.success && response.data) {
        setTerms(response.data as PaymentTerms);
        setEditedTerms(response.data as PaymentTerms);
      }
    } catch (error) {
      console.error('Failed to fetch payment terms:', error);
      toast.error('Failed to load payment terms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedTerms) return;

    setSaving(true);
    try {
      const response = await apiService.request('PUT', '/enrollments/revenue/terms', editedTerms);
      if (response.success) {
        setTerms(response.data as PaymentTerms);
        setIsEditing(false);
        toast.success('Payment terms updated successfully');
      }
    } catch (error) {
      console.error('Failed to save payment terms:', error);
      toast.error('Failed to save payment terms');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedTerms(terms);
    setIsEditing(false);
  };

  if (!isSuperAdmin || !terms) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment Terms & Commission Setup</CardTitle>
          <CardDescription>
            Configure commission rates, payout frequency, and tax settings
          </CardDescription>
        </div>
        <Button
          variant={isEditing ? 'outline' : 'default'}
          onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
        >
          {isEditing ? 'Cancel' : 'Edit Settings'}
        </Button>
      </CardHeader>

      <CardContent>
        <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {/* Commission Rates */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Commission Rates (%)</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="attendance-rate" className="text-sm font-medium">
                    Attendance Commission Rate
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Commission earned for each workshop attendance
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="attendance-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editedTerms?.attendanceCommissionRate ?? 0}
                      onChange={(e) =>
                        setEditedTerms({
                          ...editedTerms!,
                          attendanceCommissionRate: parseFloat(e.target.value)
                        })
                      }
                      disabled={!isEditing}
                      className="flex-1"
                    />
                    <span className="text-sm font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="enrollment-rate" className="text-sm font-medium">
                    Enrollment Commission Rate
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Additional commission earned when parent enrolls and pays
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="enrollment-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editedTerms?.enrollmentCommissionRate ?? 0}
                      onChange={(e) =>
                        setEditedTerms({
                          ...editedTerms!,
                          enrollmentCommissionRate: parseFloat(e.target.value)
                        })
                      }
                      disabled={!isEditing}
                      className="flex-1"
                    />
                    <span className="text-sm font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-ticket-value" className="text-sm font-medium">
                    Event Ticket Value (per child)
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Default ticket price - used to auto-populate enrollment total amount
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{editedTerms?.currency || 'KES'}</span>
                    <Input
                      id="event-ticket-value"
                      type="number"
                      min="0"
                      step="100"
                      value={editedTerms?.eventTicketValue ?? 0}
                      onChange={(e) =>
                        setEditedTerms({
                          ...editedTerms!,
                          eventTicketValue: parseFloat(e.target.value)
                        })
                      }
                      disabled={!isEditing}
                      className="flex-1"
                      placeholder="e.g., 5000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tax-rate" className="text-sm font-medium">
                    Tax Rate (GST/VAT) - Optional
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Tax applied to total commission (leave empty if not applicable)
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editedTerms?.taxRate ?? ''}
                      onChange={(e) =>
                        setEditedTerms({
                          ...editedTerms!,
                          taxRate: e.target.value ? parseFloat(e.target.value) : null
                        })
                      }
                      disabled={!isEditing}
                      className="flex-1"
                      placeholder="Leave empty if not applicable"
                    />
                    <span className="text-sm font-semibold">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payout Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Payout Settings</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium">
                    Currency
                  </Label>
                  <Select
                    value={editedTerms?.currency ?? 'KES'}
                    onValueChange={(value) =>
                      setEditedTerms({
                        ...editedTerms!,
                        currency: value as 'KES' | 'INR' | 'USD' | 'EUR' | 'GBP'
                      })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payout-freq" className="text-sm font-medium">
                    Payout Frequency
                  </Label>
                  <Select
                    value={editedTerms?.payoutFrequency ?? 'monthly'}
                    onValueChange={(value) =>
                      setEditedTerms({
                        ...editedTerms!,
                        payoutFrequency: value as 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
                      })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="payout-freq">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payout-day" className="text-sm font-medium">
                    Payout Day (of month)
                  </Label>
                  <Input
                    id="payout-day"
                    type="number"
                    min="1"
                    max="31"
                    value={editedTerms?.payoutDay ?? 15}
                    onChange={(e) =>
                      setEditedTerms({
                        ...editedTerms!,
                        payoutDay: parseInt(e.target.value)
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="min-payout" className="text-sm font-medium">
                    Minimum Payout Amount - Optional
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Commission must reach this amount before payout is triggered (leave empty for no limit)
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="min-payout"
                      type="number"
                      min="0"
                      step="100"
                      value={editedTerms?.minimumPayoutAmount ?? ''}
                      onChange={(e) =>
                        setEditedTerms({
                          ...editedTerms!,
                          minimumPayoutAmount: e.target.value ? parseFloat(e.target.value) : null
                        })
                      }
                      disabled={!isEditing}
                      className="flex-1"
                      placeholder="Leave empty for no limit"
                    />
                    <span className="text-sm font-semibold">{editedTerms?.currency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated Info */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-gray-500">
            Last updated: {terms.updatedAt ? new Date(terms.updatedAt).toLocaleDateString() : 'Never'}
          </p>
          <p className="text-xs text-gray-500">
            Effective from: {terms.effectiveFrom ? new Date(terms.effectiveFrom).toLocaleDateString() : 'N/A'}
          </p>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
