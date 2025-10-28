// Chart color palette
export const chartColors = {
  primary: '#02542D',
  secondary: '#1C7847',
  accent1: '#4CAF50',
  accent2: '#8BC34A',
  gradient: 'rgba(2, 84, 45, 0.1)',
  
  // Color arrays for multiple data series
  greenShades: ['#02542D', '#1C7847', '#4CAF50', '#8BC34A', '#C8E6C9', '#66BB6A', '#81C784', '#A5D6A7'],
  pieChartColors: [
    '#02542D',  // Deep green
    '#1C7847',  // Forest green  
    '#4CAF50',  // Material green
    '#8BC34A',  // Light green
    '#66BB6A',  // Medium green
    '#81C784',  // Soft green
    '#A5D6A7',  // Very light green
    '#C8E6C9'   // Pale green
  ],
  profitColors: ['#8BC34A', '#4CAF50', '#02542D']
};

// Transform daily income data for Chart.js line chart
export const transformDailyIncomeData = (dailyData) => {
  if (!Array.isArray(dailyData) || dailyData.length === 0) {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Daily Income',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: chartColors.primary,
        backgroundColor: chartColors.gradient,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    };
  }

  // Sort data by day
  const sortedData = [...dailyData].sort((a, b) => a.day - b.day);

  const labels = sortedData.map(item =>
    item.dayName?.substring(0, 3) || `Day ${item.day}`
  );

  // Use date properties on the datasets as referced in the context
  const collected = sortedData.map(item => parseFloat(item.amount) || 0);
  const collectible = sortedData.map(item => parseFloat(item.collectibleAmount) || 0);
  const total = sortedData.map((_, idx) => collected[idx] + collectible[idx]);

  return {
    labels,
    datasets: [
      {
        label: 'Total Income',
        data: total,
        borderColor: chartColors.primary,
        backgroundColor: chartColors.gradient,
        tension: 0.4,
        fill: false,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4
      },
      {
        label: 'Collected Income',
        data: collected,
        borderColor: chartColors.accent1,
        backgroundColor: chartColors.accent1,
        tension: 0.4,
        fill: false,
        borderDash: [4, 4],
        pointBackgroundColor: chartColors.accent1,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4
      },
      {
        label: 'Collectible Income',
        data: collectible,
        borderColor: chartColors.accent2,
        backgroundColor: chartColors.accent2,
        tension: 0.4,
        fill: false,
        borderDash: [2, 2],
        pointBackgroundColor: chartColors.accent2,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4
      }
    ]
  };
};

// Transform expenses by department data for Chart.js pie chart
export const transformExpensesByDepartment = (expensesData) => {
  
  if (!Array.isArray(expensesData) || expensesData.length === 0) {

    return {
      labels: ['No Data'],
      datasets: [{
        data: [100],
        backgroundColor: ['#E0E0E0'],
        borderColor: ['#ffffff'],
        borderWidth: 2
      }],
      legendData: [{
        label: 'No Data',
        color: '#E0E0E0',
        amount: 0,
        percentage: 100
      }]
    };
  }

  const labels = expensesData.map(item => item.department || 'Unknown');
  const amounts = expensesData.map(item => parseFloat(item.amount) || 0);
  const percentages = expensesData.map(item => parseFloat(item.percentage) || 0);
  
  
  // Generate distinct colors for each department
  const colors = labels.map((_, index) => 
    chartColors.pieChartColors[index % chartColors.pieChartColors.length]
  );

  // Legend data for manual legend rendering with proper percentage calculation
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  const legendData = labels.map((label, index) => ({
    label,
    color: colors[index],
    amount: amounts[index],
    percentage: total > 0 ? parseFloat(((amounts[index] / total) * 100).toFixed(2)) : 0
  }));

  return {
    labels,
    datasets: [{
      data: amounts,
      backgroundColor: colors,
      borderColor: colors.map(() => '#ffffff'),
      borderWidth: 2,
      hoverOffset: 6,
      hoverBorderWidth: 3,
      hoverBorderColor: '#ffffff'
    }],
    legendData
  };
};

// Transform monthly profit data for Chart.js bar chart
export const transformMonthlyProfitData = (monthlyData) => {
  if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
    // Return default 12-month structure
    const defaultMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      labels: defaultMonths,
      datasets: [
        {
          label: 'Revenue',
          data: new Array(12).fill(0),
          backgroundColor: '#84cc16', // Light green/lime
          borderWidth: 0,
          borderRadius: 4,
          barThickness: 15
        },
        {
          label: 'Expenses',
          data: new Array(12).fill(0),
          backgroundColor: '#15803d', // Dark green
          borderWidth: 0,
          borderRadius: 4,
          barThickness: 15
        },
        {
          label: 'Profit',
          data: new Array(12).fill(0),
          backgroundColor: '#84cc16', // Lime green
          borderWidth: 0,
          borderRadius: 4,
          barThickness: 15
        },
        {
          label: 'Loss',
          data: new Array(12).fill(0),
          backgroundColor: '#dc2626', // Red/orange for loss
          borderWidth: 0,
          borderRadius: 4,
          barThickness: 15
        }
      ]
    };
  }

  // Ensure we have all 12 months
  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const labels = allMonths;

  // Extract data for each month
  const revenueData = allMonths.map((_, index) => {
    const monthData = monthlyData.find(item => item.month === index + 1);
    return monthData ? parseFloat(monthData.revenue) || 0 : 0;
  });

  const expensesData = allMonths.map((_, index) => {
    const monthData = monthlyData.find(item => item.month === index + 1);
    return monthData ? parseFloat(monthData.expenses) || 0 : 0;
  });

  const profitData = allMonths.map((_, index) => {
    const monthData = monthlyData.find(item => item.month === index + 1);
    const profit = monthData ? parseFloat(monthData.profit) || 0 : 0;
    // Only show positive values in profit column
    return profit > 0 ? profit : 0;
  });

  const lossData = allMonths.map((_, index) => {
    const monthData = monthlyData.find(item => item.month === index + 1);
    const profit = monthData ? parseFloat(monthData.profit) || 0 : 0;
    // Only show negative values (as positive numbers) in loss column
    return profit < 0 ? Math.abs(profit) : 0;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: revenueData,
        backgroundColor: '#84cc16', // Light green/lime
        borderWidth: 0,
        borderRadius: 4,
        barThickness: 15
      },
      {
        label: 'Expenses',
        data: expensesData,
        backgroundColor: '#15803d', // Dark green
        borderWidth: 0,
        borderRadius: 4,
        barThickness: 15
      },
      {
        label: 'Profit',
        data: profitData,
        backgroundColor: '#a3e635', // Lime green
        borderWidth: 0,
        borderRadius: 4,
        barThickness: 15
      },
      {
        label: 'Loss',
        data: lossData,
        backgroundColor: '#ea580c', // Orange/red for loss
        borderWidth: 0,
        borderRadius: 4,
        barThickness: 15
      }
    ]
  };
};

// Format currency for tooltips and labels
export const formatCurrency = (amount, currency = '₱') => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

// Common chart options
export const getCommonChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      cornerRadius: 4,
      displayColors: false
    }
  }
});

// Line chart specific options
export const getLineChartOptions = () => ({
  ...getCommonChartOptions(),
  plugins: {
    ...getCommonChartOptions().plugins,
    tooltip: {
      ...getCommonChartOptions().plugins.tooltip,
      callbacks: {
        label: function(context) {
          return `Income: ${formatCurrency(context.parsed.y)}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1000,
        font: { size: 10 },
        callback: function(value) {
          return formatCurrency(value);
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    }
  }
});

// Pie chart specific options
export const getPieChartOptions = () => ({
  ...getCommonChartOptions(),
  plugins: {
    ...getCommonChartOptions().plugins,
    tooltip: {
      ...getCommonChartOptions().plugins.tooltip,
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return `${label}: ${formatCurrency(value)} (${percentage}%)`;
        }
      }
    }
  }
});

// Bar chart specific options
export const getBarChartOptions = () => ({
  ...getCommonChartOptions(),
  plugins: {
    ...getCommonChartOptions().plugins,
    tooltip: {
      ...getCommonChartOptions().plugins.tooltip,
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || '';
          return `${label}: ${formatCurrency(context.parsed.y)}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        callback: function(value) {
          // Show as 'k' for thousands
          if (value >= 1000) {
            return `${value/1000}k`;
          }
          return value === 0 ? '0' : value;
        },
        font: {
          size: 11
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    }
  }
});
