import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiService, {
  SubscriptionPlan,
  Subscription,
  Voucher,
  VoucherSummary,
  VoucherStatus,
  SubscriptionStatus,
  ActiveSubscriptionSummary,
  CheckVoucherEligibilityRequest,
  PurchaseSubscriptionResponse,
  CancelSubscriptionResponse,
  CheckVoucherEligibilityResponse,
} from '../services/api.service';
import { useUser } from './UserContext';

// ============================================
// TYPES
// ============================================

interface SubscriptionContextType {
  // State
  plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  activeSubscription: ActiveSubscriptionSummary | null;
  vouchers: Voucher[];
  voucherSummary: VoucherSummary;
  totalVouchersAvailable: number;
  usableVouchers: number; // AVAILABLE + RESTORED vouchers count
  loading: boolean;
  plansLoading: boolean;
  vouchersLoading: boolean;
  error: string | null;

  // Actions
  fetchPlans: (zoneId?: string) => Promise<void>;
  fetchSubscriptions: (status?: SubscriptionStatus) => Promise<void>;
  fetchVouchers: (status?: VoucherStatus) => Promise<void>;
  purchasePlan: (planId: string) => Promise<PurchaseSubscriptionResponse>;
  cancelSubscription: (subscriptionId: string, reason?: string) => Promise<CancelSubscriptionResponse>;
  checkEligibility: (data: CheckVoucherEligibilityRequest) => Promise<CheckVoucherEligibilityResponse>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

const defaultVoucherSummary: VoucherSummary = {
  available: 0,
  redeemed: 0,
  expired: 0,
  restored: 0,
  total: 0,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isGuest, isAuthenticated } = useUser();

  // State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscriptionSummary | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherSummary, setVoucherSummary] = useState<VoucherSummary>(defaultVoucherSummary);
  const [totalVouchersAvailable, setTotalVouchersAvailable] = useState(0);
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch active plans
  const fetchPlans = useCallback(async (zoneId?: string) => {
    console.log('[SubscriptionContext] fetchPlans - Starting');
    setPlansLoading(true);
    setError(null);
    try {
      const response = await apiService.getActivePlans(zoneId);
      console.log('[SubscriptionContext] fetchPlans - Success, plans count:', response.data.plans.length);
      setPlans(response.data.plans);
    } catch (err: any) {
      console.log('[SubscriptionContext] fetchPlans - Error:', err.message || err);
      setError(err.message || 'Failed to fetch plans');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Fetch user subscriptions
  const fetchSubscriptions = useCallback(async (status?: SubscriptionStatus) => {
    if (isGuest || !isAuthenticated) {
      console.log('[SubscriptionContext] fetchSubscriptions - Skipping (guest or not authenticated)');
      return;
    }

    console.log('[SubscriptionContext] fetchSubscriptions - Starting');
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getMySubscriptions({ status });
      console.log('[SubscriptionContext] fetchSubscriptions - Success');
      console.log('[SubscriptionContext] fetchSubscriptions - Full response:', JSON.stringify(response.data));

      const subscriptionsData = response.data.subscriptions || [];
      console.log('[SubscriptionContext] fetchSubscriptions - Subscriptions count:', subscriptionsData.length);
      console.log('[SubscriptionContext] fetchSubscriptions - Active subscription from API:', JSON.stringify(response.data.activeSubscription));
      console.log('[SubscriptionContext] fetchSubscriptions - Total vouchers available:', response.data.totalVouchersAvailable);

      setSubscriptions(subscriptionsData);

      // Handle activeSubscription - use API data or derive from subscriptions
      let activeSubData: ActiveSubscriptionSummary | null = response.data.activeSubscription;

      // If API doesn't provide activeSubscription, try to derive from subscriptions
      if (!activeSubData && subscriptionsData.length > 0) {
        const activeSub = subscriptionsData.find((s: Subscription) => s.status === 'ACTIVE');
        if (activeSub) {
          activeSubData = {
            _id: activeSub._id,
            planName: activeSub.planSnapshot?.name || 'Subscription Plan',
            vouchersRemaining: activeSub.vouchersRemaining ?? (activeSub.totalVouchersIssued - activeSub.vouchersUsed),
            daysRemaining: activeSub.daysRemaining ?? 0,
            expiryDate: activeSub.voucherExpiryDate || activeSub.endDate,
          };
          console.log('[SubscriptionContext] fetchSubscriptions - Derived active subscription:', JSON.stringify(activeSubData));
        }
      }

      // If activeSubscription exists but is missing fields, try to fill them from subscriptions
      if (activeSubData && (!activeSubData.planName || !activeSubData.expiryDate)) {
        const activeSub = subscriptionsData.find((s: Subscription) => s._id === activeSubData!._id || s.status === 'ACTIVE');
        if (activeSub) {
          activeSubData = {
            _id: activeSubData._id || activeSub._id,
            planName: activeSubData.planName || activeSub.planSnapshot?.name || 'Subscription Plan',
            vouchersRemaining: activeSubData.vouchersRemaining ?? activeSub.vouchersRemaining ?? (activeSub.totalVouchersIssued - activeSub.vouchersUsed),
            daysRemaining: activeSubData.daysRemaining ?? activeSub.daysRemaining ?? 0,
            expiryDate: activeSubData.expiryDate || activeSub.voucherExpiryDate || activeSub.endDate,
          };
          console.log('[SubscriptionContext] fetchSubscriptions - Fixed active subscription with missing fields:', JSON.stringify(activeSubData));
        }
      }

      setActiveSubscription(activeSubData || null);
      setTotalVouchersAvailable(response.data.totalVouchersAvailable || 0);
    } catch (err: any) {
      console.log('[SubscriptionContext] fetchSubscriptions - Error:', err.message || err);
      setError(err.message || 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, [isGuest, isAuthenticated]);

  // Fetch user vouchers
  const fetchVouchers = useCallback(async (status?: VoucherStatus) => {
    if (isGuest || !isAuthenticated) {
      console.log('[SubscriptionContext] fetchVouchers - Skipping (guest or not authenticated)');
      return;
    }

    console.log('[SubscriptionContext] fetchVouchers - Starting, status filter:', status || 'none');
    setVouchersLoading(true);
    setError(null);
    try {
      const response = await apiService.getMyVouchers({ status });
      console.log('[SubscriptionContext] fetchVouchers - Success');
      console.log('[SubscriptionContext] fetchVouchers - Vouchers array length:', response.data.vouchers.length);
      console.log('[SubscriptionContext] fetchVouchers - Summary from API:', JSON.stringify(response.data.summary));

      // DEBUG: Log each voucher status
      const statusCounts = response.data.vouchers.reduce((acc: any, v: any) => {
        acc[v.status] = (acc[v.status] || 0) + 1;
        return acc;
      }, {});
      console.log('[SubscriptionContext] fetchVouchers - Status breakdown:', JSON.stringify(statusCounts));

      const vouchersData = response.data.vouchers || [];
      setVouchers(vouchersData);

      // Calculate summary from vouchers if API doesn't provide it
      if (response.data.summary) {
        setVoucherSummary(response.data.summary);
      } else {
        // Calculate summary client-side from vouchers array
        const calculatedSummary: VoucherSummary = {
          available: vouchersData.filter((v: Voucher) => v.status === 'AVAILABLE').length,
          redeemed: vouchersData.filter((v: Voucher) => v.status === 'REDEEMED').length,
          expired: vouchersData.filter((v: Voucher) => v.status === 'EXPIRED').length,
          restored: vouchersData.filter((v: Voucher) => v.status === 'RESTORED').length,
          total: vouchersData.length,
        };
        console.log('[SubscriptionContext] fetchVouchers - Calculated summary:', JSON.stringify(calculatedSummary));
        setVoucherSummary(calculatedSummary);
      }
    } catch (err: any) {
      console.log('[SubscriptionContext] fetchVouchers - Error:', err.message || err);
      setError(err.message || 'Failed to fetch vouchers');
    } finally {
      setVouchersLoading(false);
    }
  }, [isGuest, isAuthenticated]);

  // Purchase a plan
  const purchasePlan = useCallback(async (planId: string): Promise<PurchaseSubscriptionResponse> => {
    console.log('[SubscriptionContext] purchasePlan - Starting for plan:', planId);
    setLoading(true);
    setError(null);
    try {
      // Generate mock payment ID
      const mockPaymentId = `demo_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      console.log('[SubscriptionContext] purchasePlan - Generated mock payment ID:', mockPaymentId);

      const response = await apiService.purchaseSubscription({
        planId,
        paymentId: mockPaymentId,
        paymentMethod: 'UPI',
      });

      console.log('[SubscriptionContext] purchasePlan - Success');
      console.log('[SubscriptionContext] purchasePlan - Vouchers issued:', response.data.vouchersIssued);
      console.log('[SubscriptionContext] purchasePlan - Expiry date:', response.data.voucherExpiryDate);

      // Refresh subscriptions and vouchers after purchase
      await fetchSubscriptions();
      await fetchVouchers();

      return response;
    } catch (err: any) {
      console.log('[SubscriptionContext] purchasePlan - Error:', err.message || err);
      setError(err.message || 'Failed to purchase plan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSubscriptions, fetchVouchers]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId: string, reason?: string): Promise<CancelSubscriptionResponse> => {
    console.log('[SubscriptionContext] cancelSubscription - Starting for subscription:', subscriptionId);
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.cancelSubscription(subscriptionId, reason);

      console.log('[SubscriptionContext] cancelSubscription - Success');
      console.log('[SubscriptionContext] cancelSubscription - Vouchers cancelled:', response.data.vouchersCancelled);
      console.log('[SubscriptionContext] cancelSubscription - Refund eligible:', response.data.refundEligible);
      console.log('[SubscriptionContext] cancelSubscription - Refund amount:', response.data.refundAmount);

      // Refresh subscriptions and vouchers after cancellation
      await fetchSubscriptions();
      await fetchVouchers();

      return response;
    } catch (err: any) {
      console.log('[SubscriptionContext] cancelSubscription - Error:', err.message || err);
      setError(err.message || 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSubscriptions, fetchVouchers]);

  // Check voucher eligibility
  const checkEligibility = useCallback(async (data: CheckVoucherEligibilityRequest): Promise<CheckVoucherEligibilityResponse> => {
    console.log('[SubscriptionContext] checkEligibility - Starting');
    try {
      const response = await apiService.checkVoucherEligibility(data);

      console.log('[SubscriptionContext] checkEligibility - Success');
      console.log('[SubscriptionContext] checkEligibility - Can use voucher:', response.data.canUseVoucher);
      console.log('[SubscriptionContext] checkEligibility - Available vouchers:', response.data.availableVouchers);
      console.log('[SubscriptionContext] checkEligibility - Max redeemable:', response.data.maxRedeemable);

      return response;
    } catch (err: any) {
      console.log('[SubscriptionContext] checkEligibility - Error:', err.message || err);
      throw err;
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    console.log('[SubscriptionContext] refreshAll - Starting');
    await Promise.all([
      fetchPlans(),
      fetchSubscriptions(),
      fetchVouchers(),
    ]);
    console.log('[SubscriptionContext] refreshAll - Complete');
  }, [fetchPlans, fetchSubscriptions, fetchVouchers]);

  // Auto-fetch on mount when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isGuest && user) {
      console.log('[SubscriptionContext] useEffect - User authenticated, fetching initial data');
      // Fetch subscriptions and voucher summary on login
      fetchSubscriptions();
      fetchVouchers();
    } else {
      // Clear data when logged out or in guest mode
      console.log('[SubscriptionContext] useEffect - User not authenticated or guest, clearing data');
      setSubscriptions([]);
      setActiveSubscription(null);
      setVouchers([]);
      setVoucherSummary(defaultVoucherSummary);
      setTotalVouchersAvailable(0);
    }
  }, [isAuthenticated, isGuest, user, fetchSubscriptions, fetchVouchers]);

  // Calculate usable vouchers (AVAILABLE + RESTORED)
  const usableVouchers = (voucherSummary?.available ?? 0) + (voucherSummary?.restored ?? 0);

  // DEBUG: Log voucher calculation details whenever it changes
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[SubscriptionContext] VOUCHER COUNT CALCULATION:');
    console.log('  voucherSummary.available:', voucherSummary?.available ?? 'undefined');
    console.log('  voucherSummary.restored:', voucherSummary?.restored ?? 'undefined');
    console.log('  voucherSummary.redeemed:', voucherSummary?.redeemed ?? 'undefined');
    console.log('  voucherSummary.expired:', voucherSummary?.expired ?? 'undefined');
    console.log('  voucherSummary.total:', voucherSummary?.total ?? 'undefined');
    console.log('  → usableVouchers (available+restored):', usableVouchers);
    console.log('  totalVouchersAvailable from API:', totalVouchersAvailable);
    console.log('  vouchers array length:', vouchers.length);
    console.log('  active subscriptions count:', subscriptions.filter(s => s.status === 'ACTIVE').length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, [voucherSummary, usableVouchers, totalVouchersAvailable, vouchers.length, subscriptions]);

  const value: SubscriptionContextType = {
    // State
    plans,
    subscriptions,
    activeSubscription,
    vouchers,
    voucherSummary,
    totalVouchersAvailable,
    usableVouchers,
    loading,
    plansLoading,
    vouchersLoading,
    error,

    // Actions
    fetchPlans,
    fetchSubscriptions,
    fetchVouchers,
    purchasePlan,
    cancelSubscription,
    checkEligibility,
    refreshAll,
    clearError,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;
