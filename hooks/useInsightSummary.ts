import { useState, useEffect } from 'react';
import { useTrendAnalytics } from './useTrendAnalytics';
import { useUsageAnalytics } from './useUsageAnalytics';
import { usePlatformRevenue } from './usePlatformRevenue';

export interface Insight {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  icon: string;
}

export interface InsightSummary {
  insights: Insight[];
  isLoading: boolean;
  error: string | null;
  lastGenerated: Date | null;
}

const formatHour = (hour: number): string => {
  if (hour === 0) return '12AM';
  if (hour === 12) return '12PM';
  if (hour < 12) return `${hour}AM`;
  return `${hour - 12}PM`;
};

const getTimeOfDay = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export function useInsightSummary(): InsightSummary {
  const trendData = useTrendAnalytics();
  const usageData = useUsageAnalytics();
  const revenueData = usePlatformRevenue();

  const [summary, setSummary] = useState<InsightSummary>({
    insights: [],
    isLoading: true,
    error: null,
    lastGenerated: null,
  });

  useEffect(() => {
    if (trendData.isLoading || usageData.isLoading || revenueData.isLoading) {
      return;
    }

    console.log('[Insight Summary] Generating insights from analytics data...');

    const insights: Insight[] = [];

    if (trendData.revenue.direction === 'up' && trendData.revenue.percentChange > 5) {
      insights.push({
        id: 'revenue-growth',
        text: `Platform revenue surged ${trendData.revenue.percentChange.toFixed(1)}% week-over-week, reaching ${trendData.revenue.formattedCurrent}. Strong growth momentum detected.`,
        type: 'positive',
        icon: '📈',
      });
    } else if (trendData.revenue.direction === 'down' && trendData.revenue.percentChange > 5) {
      insights.push({
        id: 'revenue-decline',
        text: `Revenue declined ${trendData.revenue.percentChange.toFixed(1)}% from last week (${trendData.revenue.formattedPrevious} → ${trendData.revenue.formattedCurrent}). Monitor shipper activity closely.`,
        type: 'warning',
        icon: '⚠️',
      });
    } else if (trendData.revenue.currentValue > 0) {
      insights.push({
        id: 'revenue-stable',
        text: `Platform revenue holding steady at ${trendData.revenue.formattedCurrent} with ${revenueData.completedLoadsCount} completed loads this week.`,
        type: 'neutral',
        icon: '💰',
      });
    }

    if (trendData.driverCount.direction === 'up' && trendData.driverCount.percentChange > 3) {
      insights.push({
        id: 'driver-growth',
        text: `Driver base expanded ${trendData.driverCount.percentChange.toFixed(1)}% this week. ${trendData.driverCount.formattedCurrent} active drivers now on the platform.`,
        type: 'positive',
        icon: '🚛',
      });
    } else if (trendData.driverCount.direction === 'down' && trendData.driverCount.percentChange > 5) {
      insights.push({
        id: 'driver-decline',
        text: `Active driver count dropped ${trendData.driverCount.percentChange.toFixed(1)}% (${trendData.driverCount.formattedPrevious} → ${trendData.driverCount.formattedCurrent}). Consider retention initiatives.`,
        type: 'negative',
        icon: '🔻',
      });
    }

    if (trendData.shipperCount.direction === 'up' && trendData.shipperCount.percentChange > 3) {
      insights.push({
        id: 'shipper-growth',
        text: `Shipper acquisition up ${trendData.shipperCount.percentChange.toFixed(1)}% week-over-week. ${trendData.shipperCount.formattedCurrent} active shippers posting loads.`,
        type: 'positive',
        icon: '📦',
      });
    } else if (trendData.shipperCount.direction === 'down' && trendData.shipperCount.percentChange > 5) {
      insights.push({
        id: 'shipper-decline',
        text: `Shipper activity decreased ${trendData.shipperCount.percentChange.toFixed(1)}% since last week. Review onboarding and engagement strategies.`,
        type: 'warning',
        icon: '⚠️',
      });
    }

    if (usageData.peakDriverHour >= 0 && usageData.totalDriverAccepts > 0) {
      const peakHour = usageData.peakDriverHour;
      const peakCount = usageData.driverActivity[peakHour];
      const peakPercentage = ((peakCount / usageData.totalDriverAccepts) * 100).toFixed(0);
      
      insights.push({
        id: 'driver-peak-time',
        text: `Driver activity peaks at ${formatHour(peakHour)} CST with ${peakCount} load accepts (${peakPercentage}% of daily activity). Optimize load postings for ${getTimeOfDay(peakHour)} hours.`,
        type: 'neutral',
        icon: '⏰',
      });
    }

    if (usageData.peakShipperHour >= 0 && usageData.totalShipperPosts > 0) {
      const peakHour = usageData.peakShipperHour;
      const peakCount = usageData.shipperActivity[peakHour];
      const peakPercentage = ((peakCount / usageData.totalShipperPosts) * 100).toFixed(0);
      
      if (Math.abs(peakHour - usageData.peakDriverHour) > 3) {
        insights.push({
          id: 'timing-mismatch',
          text: `Shippers post most loads at ${formatHour(peakHour)} CST (${peakCount} posts, ${peakPercentage}%), but drivers are most active at ${formatHour(usageData.peakDriverHour)} CST. Consider incentivizing aligned timing.`,
          type: 'warning',
          icon: '🔄',
        });
      }
    }

    if (trendData.completedLoads.direction === 'up' && trendData.completedLoads.percentChange > 10) {
      insights.push({
        id: 'completion-surge',
        text: `Load completion rate jumped ${trendData.completedLoads.percentChange.toFixed(1)}% this week (${trendData.completedLoads.formattedCurrent} completed). Excellent operational efficiency.`,
        type: 'positive',
        icon: '✅',
      });
    } else if (trendData.completedLoads.direction === 'down' && trendData.completedLoads.percentChange > 10) {
      insights.push({
        id: 'completion-drop',
        text: `Completed loads fell ${trendData.completedLoads.percentChange.toFixed(1)}% from last week. Investigate potential bottlenecks in driver-shipper matching.`,
        type: 'negative',
        icon: '❌',
      });
    }

    if (trendData.activeLoads.currentValue > 50 && trendData.driverCount.currentValue < 20) {
      insights.push({
        id: 'supply-demand-imbalance',
        text: `High load volume (${trendData.activeLoads.formattedCurrent} active) with limited driver capacity (${trendData.driverCount.formattedCurrent} active). Prioritize driver recruitment.`,
        type: 'warning',
        icon: '⚖️',
      });
    }

    if (revenueData.commission > 0) {
      const commissionPercentage = ((revenueData.commission / revenueData.totalRevenue) * 100).toFixed(1);
      insights.push({
        id: 'platform-earnings',
        text: `LoadRush earned ${revenueData.formattedCommission} in platform fees (${commissionPercentage}% commission) from ${revenueData.completedLoadsCount} completed loads.`,
        type: 'neutral',
        icon: '💵',
      });
    }

    insights.sort((a, b) => {
      const priority = { positive: 0, warning: 1, negative: 2, neutral: 3 };
      return priority[a.type] - priority[b.type];
    });

    const topInsights = insights.slice(0, 5);

    console.log('[Insight Summary] Generated', topInsights.length, 'insights');

    setSummary({
      insights: topInsights,
      isLoading: false,
      error: null,
      lastGenerated: new Date(),
    });
  }, [
    trendData.isLoading,
    trendData.revenue,
    trendData.driverCount,
    trendData.shipperCount,
    trendData.completedLoads,
    trendData.activeLoads,
    usageData.isLoading,
    usageData.peakDriverHour,
    usageData.peakShipperHour,
    usageData.totalDriverAccepts,
    usageData.totalShipperPosts,
    usageData.driverActivity,
    usageData.shipperActivity,
    revenueData.isLoading,
    revenueData.commission,
    revenueData.totalRevenue,
    revenueData.completedLoadsCount,
    revenueData.formattedCommission,
  ]);

  return summary;
}
