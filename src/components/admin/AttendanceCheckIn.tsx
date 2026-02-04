import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { QrCode, CheckCircle, AlertCircle, Loader2, RotateCw } from 'lucide-react';

interface QRValidationResponse {
  attendanceId: string;
  enrollmentId: string;
  parentName: string;
  workshopDate: string;
  status: string;
}

interface CheckInData {
  attendanceId: string;
  parentName: string;
  checkInTime: Date;
  status: 'success' | 'duplicate' | 'error';
  message: string;
}

interface AttendanceCheckInProps {
  isSuperAdmin: boolean;
}

export const AttendanceCheckIn = ({ isSuperAdmin }: AttendanceCheckInProps) => {
  const [qrInput, setQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInData[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<QRValidationResponse | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSuperAdmin && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [isSuperAdmin]);

  const handleQRValidation = async (qrCode: string) => {
    if (!qrCode.trim()) {
      toast.error('Please enter or scan a QR code');
      return;
    }

    setValidating(true);
    try {
      const response = await apiService.request<QRValidationResponse>(
        'GET',
        `/attendance/qr/${qrCode.trim()}`
      );

      if (response.success && response.data) {
        setValidationResult(response.data);
        setConfirmDialogOpen(true);
      } else {
        toast.error('QR code not found');
        addCheckInRecord({
          attendanceId: '',
          parentName: 'Unknown',
          checkInTime: new Date(),
          status: 'error',
          message: response.message || 'QR code not found'
        });
      }
    } catch (error) {
      console.error('QR validation error:', error);
      toast.error('Failed to validate QR code');
      addCheckInRecord({
        attendanceId: '',
        parentName: 'Unknown',
        checkInTime: new Date(),
        status: 'error',
        message: 'Validation failed'
      });
    } finally {
      setValidating(false);
      setQrInput('');
      if (qrInputRef.current) {
        qrInputRef.current.focus();
      }
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!validationResult) return;

    setValidating(true);
    try {
      const response = await apiService.request(
        'PATCH',
        `/attendance/${validationResult.attendanceId}`,
        {
          status: 'attended',
          attendanceDate: new Date().toISOString().split('T')[0]
        }
      );

      if (response.success) {
        toast.success(`${validationResult.parentName} marked as attended!`);
        addCheckInRecord({
          attendanceId: validationResult.attendanceId,
          parentName: validationResult.parentName,
          checkInTime: new Date(),
          status: 'success',
          message: 'Check-in successful'
        });
        setConfirmDialogOpen(false);
        setValidationResult(null);
      } else {
        // Check if already marked as attended
        if (response.message?.includes('already recorded')) {
          toast.warning('Already marked as attended');
          addCheckInRecord({
            attendanceId: validationResult.attendanceId,
            parentName: validationResult.parentName,
            checkInTime: new Date(),
            status: 'duplicate',
            message: 'Already checked in'
          });
        } else {
          toast.error('Failed to record check-in');
          addCheckInRecord({
            attendanceId: validationResult.attendanceId,
            parentName: validationResult.parentName,
            checkInTime: new Date(),
            status: 'error',
            message: 'Check-in failed'
          });
        }
        setConfirmDialogOpen(false);
        setValidationResult(null);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in');
      addCheckInRecord({
        attendanceId: validationResult.attendanceId,
        parentName: validationResult.parentName,
        checkInTime: new Date(),
        status: 'error',
        message: 'Network error'
      });
      setConfirmDialogOpen(false);
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  const addCheckInRecord = (record: CheckInData) => {
    setRecentCheckIns((prev) => [record, ...prev].slice(0, 10));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'duplicate':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'duplicate':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Workshop Check-In
        </CardTitle>
        <CardDescription>
          Scan QR codes or manually enter codes to record attendance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Scanner Input */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="qr-input" className="text-sm font-medium">
              {isScanning ? 'Camera Active - Point at QR Code' : 'Enter QR Code'}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {isScanning
                ? 'Scanner is active. Keep your camera pointed at the QR code.'
                : 'Scan a QR code or paste it manually'}
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              ref={qrInputRef}
              id="qr-input"
              type="text"
              placeholder="Scan or paste QR code here..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleQRValidation(qrInput);
                }
              }}
              disabled={validating}
              className="font-mono"
              autoFocus
            />
            <Button
              onClick={() => handleQRValidation(qrInput)}
              disabled={validating || !qrInput.trim()}
              className="gap-2"
            >
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  Validate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Recent Check-Ins */}
        {recentCheckIns.length > 0 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Recent Check-Ins</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {recentCheckIns.length} check-in{recentCheckIns.length !== 1 ? 's' : ''} today
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {recentCheckIns.map((checkIn, index) => (
                  <motion.div
                    key={`${checkIn.attendanceId}-${checkIn.checkInTime.getTime()}`}
                    layout
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.3 }}
                    className={`p-3 rounded-lg border flex items-center justify-between ${getStatusColor(checkIn.status)}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(checkIn.status)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {checkIn.parentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {checkIn.checkInTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-white/50 whitespace-nowrap">
                      {checkIn.status === 'success' && 'Checked In'}
                      {checkIn.status === 'duplicate' && 'Already In'}
                      {checkIn.status === 'error' && 'Error'}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {recentCheckIns.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setRecentCheckIns([])}
                className="w-full gap-2 mt-2"
              >
                <RotateCw className="h-4 w-4" />
                Clear History
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {recentCheckIns.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No check-ins yet. Start scanning QR codes!</p>
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Check-In</DialogTitle>
            <DialogDescription>
              Is this the correct person?
            </DialogDescription>
          </DialogHeader>

          {validationResult && (
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <p className="text-sm font-medium text-blue-900 mb-2">Parent Name</p>
                <p className="text-2xl font-bold text-blue-700">
                  {validationResult.parentName}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Workshop: {new Date(validationResult.workshopDate).toLocaleDateString()}
                </p>
              </motion.div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmDialogOpen(false);
                    setValidationResult(null);
                    if (qrInputRef.current) {
                      qrInputRef.current.focus();
                    }
                  }}
                  disabled={validating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmCheckIn}
                  disabled={validating}
                  className="flex-1 gap-2"
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirm Check-In
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
