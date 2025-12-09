export interface TransferWindowPeriod {
  open: string;  // YYYY-MM-DD
  close: string; // YYYY-MM-DD
}

export interface WindowStatus {
  isOpen: boolean;
  window?: TransferWindowPeriod;
  nextWindow?: TransferWindowPeriod;
  countdown?: string;
  message?: string;
}

// Centralized transfer window configuration
export const WINDOW_CONFIG: Record<string, TransferWindowPeriod[]> = {
  'Premier League': [
    { open: '2023-07-01', close: '2023-08-31' }, // summer
    { open: '2024-01-01', close: '2024-01-31' }, // winter
  ],
  'La Liga': [
    { open: '2023-07-01', close: '2023-08-31' },
    { open: '2024-01-01', close: '2024-01-31' },
  ],
};

const toDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00Z`);

const diffInDays = (from: Date, to: Date) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((from.getTime() - to.getTime()) / msPerDay);
};

/**
 * Compute current window status for a league.
 * Falls back to "open" when league not configured.
 */
export const getWindowStatus = (league?: string, todayInput?: string | Date): WindowStatus => {
  const leagueKey = league || 'Premier League';
  const windows = WINDOW_CONFIG[leagueKey];
  const today = todayInput instanceof Date ? todayInput : todayInput ? new Date(`${todayInput}T00:00:00Z`) : new Date();

  if (!windows || windows.length === 0) {
    return {
      isOpen: true,
      message: '窗口未配置（默认开放）',
    };
  }

  // Find active window
  for (const w of windows) {
    const open = toDate(w.open);
    const close = toDate(w.close);
    if (today >= open && today <= close) {
      const daysToClose = diffInDays(close, today);
      return {
        isOpen: true,
        window: w,
        countdown: `距离关窗：${Math.max(0, daysToClose)}天`,
      };
    }
  }

  // Not open: find next upcoming window
  const upcoming = [...windows].sort((a, b) => toDate(a.open).getTime() - toDate(b.open).getTime())
    .find(w => today < toDate(w.open));

  if (upcoming) {
    const daysToOpen = diffInDays(toDate(upcoming.open), today);
    return {
      isOpen: false,
      nextWindow: upcoming,
      countdown: `距离开窗：${Math.max(0, daysToOpen)}天`,
      message: '当前不在转会窗口开放期',
    };
  }

  // Past all windows this season -> treat as closed with no upcoming
  return {
    isOpen: false,
    message: '当前不在转会窗口开放期',
    countdown: '窗口已关闭',
  };
};

