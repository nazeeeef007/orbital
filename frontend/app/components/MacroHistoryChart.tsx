import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// --- Light Blue Color Palette (Strava-inspired) ---
const Colors = {
  primary: '#6C63FF', // Deep blue
  secondary: '#4A9BC7', // Medium blue  
  tertiary: '#7FB3D3', // Light blue
  background: '#F8FAFB', // Very light grey-blue
  cardBackground: '#FFFFFF', // Pure white cards
  cardBackgroundSecondary: '#F0F4F7', // Light blue tint
  textPrimary: '#1A202C', // Deep grey-black
  textSecondary: '#4A5568', // Medium grey
  textTertiary: '#718096', // Light grey
  border: '#E2E8F0', // Very light grey
  accent: '#38B2AC', // Teal accent
  // Enhanced chart colors with blue theme
  chartLineCalories: '#FF6B6B', // Coral red
  chartLineProtein: '#4ECDC4', // Teal
  chartLineCarbs: '#45B7D1', // Sky blue
  chartLineFat: '#96CEB4', // Mint green
  chartGrid: 'rgba(74, 155, 199, 0.1)', // Light blue grid
  chartLabel: '#718096', // Grey labels
  success: '#48BB78',
  warning: '#ED8936',
  error: '#F56565',
  shadowColor: 'rgba(46, 134, 171, 0.15)', // Blue shadow
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32;

interface DailyMacroHistory {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroHistoryChartProps {
  macroHistory: DailyMacroHistory[];
}

const MacroHistoryChart: React.FC<MacroHistoryChartProps> = ({ macroHistory }) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    macro: 'calories' | 'protein' | 'carbs' | 'fat' | null;
    value: number | null;
    date: string | null;
    x: number;
    y: number;
  }>({ macro: null, value: null, date: null, x: 0, y: 0 });

  const [selectedMacro, setSelectedMacro] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');

  // Sort by date and get last 7 days
  const sortedHistory = [...macroHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const last7 = sortedHistory.slice(-7);

  const labels = last7.map(d =>
    new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  );

  const chartData = {
    calories: last7.map(d => d.calories),
    protein: last7.map(d => d.protein),
    carbs: last7.map(d => d.carbs),
    fat: last7.map(d => d.fat),
  };

  if (macroHistory.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="analytics-outline" size={32} color={Colors.cardBackground} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptyText}>
            Track your meals for 2+ days to unlock powerful macro analytics and personalized insights
          </Text>
          <View style={styles.emptyStatsContainer}>
            <View style={styles.emptyStat}>
              <Text style={styles.emptyStatNumber}>0</Text>
              <Text style={styles.emptyStatLabel}>Days Logged</Text>
            </View>
            <View style={styles.emptyStatDivider} />
            <View style={styles.emptyStat}>
              <Text style={styles.emptyStatNumber}>4</Text>
              <Text style={styles.emptyStatLabel}>Macros Tracked</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Enhanced chart configuration for light mode
  const chartConfig = {
    backgroundColor: Colors.cardBackground,
    backgroundGradientFrom: Colors.cardBackground,
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: Colors.cardBackground,
    backgroundGradientToOpacity: 1,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(113, 128, 150, ${opacity * 0.3})`,
    labelColor: (opacity = 1) => Colors.chartLabel,
    strokeWidth: 3,
    propsForDots: {
      r: '6',
      strokeWidth: '3',
      stroke: Colors.cardBackground,
    },
    propsForBackgroundLines: {
      stroke: Colors.chartGrid,
      strokeWidth: 1,
    },
    fillShadowGradientFromOpacity: 0.1,
    fillShadowGradientToOpacity: 0,
    bezier: true,
    withVerticalLines: false,
    withHorizontalLines: true,
    fromZero: false,
    segments: 4,
  };

  const macroConfig = {
    calories: { color: Colors.chartLineCalories, unit: 'kcal', icon: 'flame-outline', gradient: ['#FF8A80', '#FF6B6B'] },
    protein: { color: Colors.chartLineProtein, unit: 'g', icon: 'fitness-outline', gradient: ['#80CBC4', '#4ECDC4'] },
    carbs: { color: Colors.chartLineCarbs, unit: 'g', icon: 'leaf-outline', gradient: ['#81C784', '#45B7D1'] },
    fat: { color: Colors.chartLineFat, unit: 'g', icon: 'water-outline', gradient: ['#A5D6A7', '#96CEB4'] },
  };

  const handleDataPointClick = (data: { value: number; index: number; x: number; y: number }) => {
    setActiveTooltip({
      macro: selectedMacro,
      value: data.value,
      date: new Date(last7[data.index].date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      }),
      x: data.x,
      y: data.y,
    });
  };

  const clearTooltip = () => {
    setActiveTooltip({ macro: null, value: null, date: null, x: 0, y: 0 });
  };

  const getAverage = (data: number[]) => {
    return Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  };

  const getTrend = (data: number[]) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const earlier = data.slice(0, -3).reduce((a, b) => a + b, 0) / (data.length - 3);
    return ((recent - earlier) / earlier) * 100;
  };

  const getMaxValue = (data: number[]) => Math.max(...data);
  const getMinValue = (data: number[]) => Math.min(...data);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Ionicons name="analytics" size={28} color={Colors.cardBackground} style={styles.headerIcon} />
            <Text style={styles.mainTitle}>Macro Analytics</Text>
            <Text style={styles.mainSubtitle}>
              {Math.min(macroHistory.length, 7)}-day performance dashboard
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Macro Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>Select Macro</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {Object.entries(macroConfig).map(([macro, config]) => (
            <TouchableOpacity
              key={macro}
              style={[
                styles.selectorButton,
                selectedMacro === macro && styles.selectorButtonActive
              ]}
              onPress={() => {
                setSelectedMacro(macro as any);
                clearTooltip();
              }}
            >
              <LinearGradient
                colors={selectedMacro === macro ? [Colors.primary, Colors.secondary] : [Colors.cardBackground, Colors.cardBackground]}
                style={styles.selectorButtonGradient}
              >
                <Ionicons 
                  name={config.icon as any} 
                  size={18} 
                  color={selectedMacro === macro ? Colors.cardBackground : Colors.textSecondary} 
                />
                <Text style={[
                  styles.selectorButtonText,
                  selectedMacro === macro && styles.selectorButtonTextActive
                ]}>
                  {macro.charAt(0).toUpperCase() + macro.slice(1)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {getAverage(chartData[selectedMacro])}
            </Text>
            <Text style={styles.statUnit}>{macroConfig[selectedMacro].unit}</Text>
            <Text style={styles.statLabel}>Daily Avg</Text>
          </View>
          
          <View style={styles.statBox}>
            <View style={styles.trendContainer}>
              <Text style={[
                styles.statValue,
                getTrend(chartData[selectedMacro]) >= 0 ? styles.trendPositive : styles.trendNegative
              ]}>
                {getTrend(chartData[selectedMacro]) >= 0 ? '+' : ''}
                {getTrend(chartData[selectedMacro]).toFixed(1)}
              </Text>
              <Ionicons 
                name={getTrend(chartData[selectedMacro]) >= 0 ? 'trending-up' : 'trending-down'} 
                size={18} 
                color={getTrend(chartData[selectedMacro]) >= 0 ? Colors.success : Colors.error}
                style={styles.trendIcon}
              />
            </View>
            <Text style={styles.statUnit}>%</Text>
            <Text style={styles.statLabel}>Trend</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {getMaxValue(chartData[selectedMacro])}
            </Text>
            <Text style={styles.statUnit}>{macroConfig[selectedMacro].unit}</Text>
            <Text style={styles.statLabel}>Peak</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {getMinValue(chartData[selectedMacro])}
            </Text>
            <Text style={styles.statUnit}>{macroConfig[selectedMacro].unit}</Text>
            <Text style={styles.statLabel}>Low</Text>
          </View>
        </View>
      </View>

      {/* Main Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <View style={[styles.chartColorDot, { backgroundColor: macroConfig[selectedMacro].color }]} />
            <Text style={styles.chartTitle}>
              {selectedMacro.charAt(0).toUpperCase() + selectedMacro.slice(1)} Progression
            </Text>
          </View>
          <Text style={styles.chartSubtitle}>Last 7 days</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScrollView}>
          <LineChart
            data={{
              labels: labels,
              datasets: [{
                data: chartData[selectedMacro],
                color: (opacity = 1) => macroConfig[selectedMacro].color,
                strokeWidth: 4,
                withDots: true,
              }],
            }}
            width={Math.max(CHART_WIDTH - 32, labels.length * 85)}
            height={240}
            chartConfig={{
              ...chartConfig,
              fillShadowGradientFrom: macroConfig[selectedMacro].color,
            }}
            style={styles.chart}
            onDataPointClick={handleDataPointClick}
            withShadow={true}
            withInnerLines={true}
          />
        </ScrollView>

        {/* Enhanced Tooltip */}
        {activeTooltip.macro === selectedMacro && activeTooltip.value !== null && (
          <View
            style={[
              styles.tooltipContainer,
              { 
                left: Math.max(20, Math.min(activeTooltip.x - 70, CHART_WIDTH - 140)), 
                top: activeTooltip.y - 90 
              },
            ]}
          >
            <View style={styles.tooltip}>
              <View style={styles.tooltipHeader}>
                <View style={[styles.tooltipDot, { backgroundColor: macroConfig[selectedMacro].color }]} />
                <Text style={styles.tooltipDate}>{activeTooltip.date}</Text>
              </View>
              <View style={styles.tooltipBody}>
                <Text style={styles.tooltipValue}>
                  {activeTooltip.value}
                </Text>
                <Text style={styles.tooltipUnit}>
                  {macroConfig[selectedMacro].unit}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Clear Button */}
      {activeTooltip.macro !== null && (
        <TouchableOpacity style={styles.clearButton} onPress={clearTooltip}>
          <View style={styles.clearButtonContainer}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.clearButtonText}>Clear Selection</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerGradient: {
    borderRadius: 20,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    padding: 28,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.cardBackground,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  selectorContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  selectorScroll: {
    paddingHorizontal: 2,
  },
  selectorButton: {
    marginHorizontal: 6,
    borderRadius: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  selectorButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  selectorButtonTextActive: {
    color: Colors.cardBackground,
  },
  statsCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    marginLeft: 2,
  },
  trendPositive: {
    color: Colors.success,
  },
  trendNegative: {
    color: Colors.error,
  },
  chartCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  chartScrollView: {
    paddingHorizontal: 4,
  },
  chart: {
    borderRadius: 16,
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 100,
  },
  tooltip: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tooltipDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tooltipBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tooltipValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tooltipUnit: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  clearButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  emptyCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  emptyStatsContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emptyStat: {
    flex: 1,
    alignItems: 'center',
  },
  emptyStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  emptyStatNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  emptyStatLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});

export default MacroHistoryChart;