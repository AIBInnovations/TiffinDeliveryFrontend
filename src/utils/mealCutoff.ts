// Three-state cutoff model shared by HomeScreen and CartScreen.
// Backend exposes per-meal: canOrder, canUseVoucher, voucherCutoffTime, orderCutoffTime
// (api.service.ts MenuItem). This util maps that into a clean 'available' / 'cash_only' / 'closed' state.

export type SlotState = 'available' | 'cash_only' | 'closed';

export interface SlotCutoffState {
  canOrder: boolean;
  canUseVoucher: boolean;
  voucherCutoffTime?: string;
  orderCutoffTime?: string;
}

export const mapCutoffState = (menuItem: any | null | undefined): SlotCutoffState => {
  if (!menuItem) return { canOrder: false, canUseVoucher: false };

  // New two-phase fields take priority
  if (menuItem.voucherCutoffTime !== undefined || menuItem.orderCutoffTime !== undefined) {
    return {
      canOrder: menuItem.canOrder ?? true,
      canUseVoucher: menuItem.canUseVoucher ?? true,
      voucherCutoffTime: menuItem.voucherCutoffTime,
      orderCutoffTime: menuItem.orderCutoffTime,
    };
  }

  // Backward compat: old single-cutoff model — isPastCutoff = voucher cutoff passed (cash only).
  // Ordering stays open until backend sends explicit canOrder:false.
  const voucherCutoffPassed = menuItem.isPastCutoff ?? false;
  return {
    canOrder: menuItem.canOrder ?? true,
    canUseVoucher: menuItem.canUseVoucher ?? !voucherCutoffPassed,
    voucherCutoffTime: menuItem.cutoffTime,
    orderCutoffTime: menuItem.cutoffTime,
  };
};

export const getSlotState = (cutoff: SlotCutoffState): SlotState => {
  if (!cutoff.canOrder) return 'closed';
  if (!cutoff.canUseVoucher) return 'cash_only';
  return 'available';
};

// Accepts "HH:mm" or "h:mm AM/PM"; returns minutes since midnight, or null.
export const parseTimeToMinutes = (timeStr: string | undefined): number | null => {
  if (!timeStr) return null;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const meridiem = m[3]?.toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  else if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Returns the next clock instant (today or tomorrow) when meal-window state would change.
// Considers all 4 cutoffs + 00:00 day rollover. Always returns a future Date.
export const nextTransitionAt = (
  lunch: SlotCutoffState,
  dinner: SlotCutoffState,
  now: Date = new Date()
): Date => {
  const currentMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  const candidates: number[] = [];
  const push = (t: string | undefined) => {
    const m = parseTimeToMinutes(t);
    if (m !== null && m > currentMin) candidates.push(m);
  };
  push(lunch.voucherCutoffTime);
  push(lunch.orderCutoffTime);
  push(dinner.voucherCutoffTime);
  push(dinner.orderCutoffTime);

  if (candidates.length > 0) {
    const nextMin = Math.min(...candidates);
    const fire = new Date(now);
    fire.setHours(Math.floor(nextMin / 60), nextMin % 60, 0, 0);
    if (fire.getTime() <= now.getTime()) fire.setMinutes(fire.getMinutes() + 1);
    return fire;
  }

  // No more transitions today → next midnight rollover
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight;
};

// Human-readable label for the next transition. Drives banner + MealWindowModal copy.
export const describeNextTransition = (
  lunch: SlotCutoffState,
  dinner: SlotCutoffState,
  now: Date = new Date()
): { label: string; atDate: Date } => {
  const atDate = nextTransitionAt(lunch, dinner, now);
  const lunchState = getSlotState(lunch);
  const dinnerState = getSlotState(dinner);

  // Both closed → next opening is tomorrow's lunch voucher window
  if (lunchState === 'closed' && dinnerState === 'closed') {
    const reopen = lunch.voucherCutoffTime || '6:00 AM';
    return { label: `${reopen} tomorrow`, atDate };
  }

  // Lunch in cash-only → next is lunch order cutoff
  if (lunchState === 'cash_only' && lunch.orderCutoffTime) {
    return { label: lunch.orderCutoffTime, atDate };
  }
  // Dinner in cash-only → next is dinner order cutoff
  if (dinnerState === 'cash_only' && dinner.orderCutoffTime) {
    return { label: dinner.orderCutoffTime, atDate };
  }

  // Lunch available → next is lunch voucher cutoff (or order cutoff if voucher cutoff missing)
  if (lunchState === 'available') {
    return { label: lunch.voucherCutoffTime || lunch.orderCutoffTime || '', atDate };
  }
  // Lunch closed but dinner not yet started — next is dinner voucher cutoff
  if (dinnerState === 'available') {
    return { label: dinner.voucherCutoffTime || dinner.orderCutoffTime || '', atDate };
  }

  return { label: '', atDate };
};

// Returns true if `now` falls inside the 9 PM - midnight schedule window.
// Used by HomeScreen to decide whether to expose the "Schedule for Tomorrow" CTA.
export const isInScheduleWindow = (now: Date = new Date()): boolean => {
  const m = now.getHours() * 60 + now.getMinutes();
  return m >= 21 * 60 && m < 24 * 60;
};
