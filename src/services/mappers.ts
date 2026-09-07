/* Адаптер: преобразует ответы backend в структуры, которые уже понимают
 * существующие компоненты дашборда. Backend и вёрстка не меняются —
 * весь маппинг живёт здесь.
 *
 * Решения по неоднозначностям:
 * - У backend нет trend/color для категорий: trend = percentage
 *   (Badge показывает долю категории — осмысленно и визуально совместимо),
 *   color — из локальной палитры по индексу.
 * - Timeline посуточный, а карточка подписана "по неделям": ключ оставляем
 *   `week` (чтобы не трогать код графика), значением идёт дата YYYY-MM-DD;
 *   подпись карточки правится в App.tsx на "по дням".
 * - Для AreaChart берём sum = expenses (траты), income/balance доступны
 *   для тултипа и будущих доработок.
 */

import type {
  AnalyticsTotals,
  CategorySlice,
  RecipientSlice,
  TimelinePoint,
} from "./api";

export interface CategoryDatum {
  name: string;
  sum: number;
  trend: number;
  color: string;
}

export interface MemberSlice {
  name: string;
  sum: number;
  color: string;
}

export interface WeekDatum {
  week: string;
  sum: number;
  income: number;
  balance: number;
}

const PALETTE = [
  "#0F3D2E",
  "#12603F",
  "#21A038",
  "#4CAF6D",
  "#7BC894",
  "#A8CF38",
  "#CBE7D3",
  "#B54FB5",
  "#9BA3AE",
  "#E3F1E7",
];

export function paletteColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export function mapCategories(slices: CategorySlice[]): CategoryDatum[] {
  return slices.map((s, i) => ({
    name: s.category,
    sum: s.amount,
    trend: s.percentage,
    color: paletteColor(i),
  }));
}

export function mapRecipients(slices: RecipientSlice[]): MemberSlice[] {
  return slices.map((r, i) => ({
    name: r.recipient,
    sum: r.amount,
    color: paletteColor(i),
  }));
}

export function mapTimeline(points: TimelinePoint[]): WeekDatum[] {
  return points.map((p) => ({
    week: p.date,
    sum: p.expenses,
    income: p.income,
    balance: p.balance,
  }));
}

export interface StatValues {
  balance: number;
  income: number;
  expenses: number;
  transactionsCount: number;
}

export function mapTotals(totals: AnalyticsTotals): StatValues {
  return {
    balance: totals.balance,
    income: totals.total_income,
    expenses: totals.total_expenses,
    transactionsCount: totals.transactions_count,
  };
}
