import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import { palette } from '../../constants/colors';

interface EvolutionChartProps {
  labels: string[];
  data: number[];
  title?: string;
  suffix?: string;
}

export default function EvolutionChart({ labels, data, title, suffix }: EvolutionChartProps) {
  const { isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const cardBg = isDark ? palette.darkCard : '#FFFFFF';
  const textPrimary = isDark ? palette.darkTextPrimary : palette.lightTextPrimary;

  if (data.length === 0) {
    return null;
  }

  // chart-kit necesita al menos 1 punto; con 1 punto duplicamos para que se vea
  const chartLabels = data.length === 1 ? [labels[0], labels[0]] : labels;
  const chartData = data.length === 1 ? [data[0], data[0]] : data;

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      {title ? <Text style={[styles.title, { color: textPrimary }]}>{title}</Text> : null}
      <LineChart
        data={{
          labels: chartLabels,
          datasets: [{ data: chartData }],
        }}
        width={screenWidth - 64}
        height={220}
        yAxisSuffix={suffix || ''}
        chartConfig={{
          backgroundColor: cardBg,
          backgroundGradientFrom: cardBg,
          backgroundGradientTo: cardBg,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
          labelColor: () => (isDark ? palette.darkTextSecondary : palette.lightTextSecondary),
          propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: palette.primary,
          },
          propsForBackgroundLines: {
            stroke: isDark ? palette.darkBorder : palette.lightBorder,
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
  },
});
