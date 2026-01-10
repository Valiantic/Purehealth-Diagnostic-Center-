/**
 * Simple Moving Average (SMA) Forecasting Utility
 * Provides functions to calculate moving averages and forecast future values
 */

/**
 * Calculate Simple Moving Average for a given dataset
 * @param {Array<number>} data - Array of numerical values
 * @param {number} windowSize - Number of periods to include in the average (default: 7)
 * @returns {number|null} - The calculated SMA or null if insufficient data
 */
export const calculateSMA = (data, windowSize = 7) => {
    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    // Filter out null/undefined values and convert to numbers
    const validData = data
        .filter(val => val !== null && val !== undefined && !isNaN(val))
        .map(val => parseFloat(val));

    if (validData.length < Math.min(3, windowSize)) {
        // Need at least 3 data points for a meaningful forecast
        return null;
    }

    // Use the specified window size or all available data if less
    const effectiveWindow = Math.min(windowSize, validData.length);
    const recentData = validData.slice(-effectiveWindow);

    const sum = recentData.reduce((acc, val) => acc + val, 0);
    return sum / recentData.length;
};

/**
 * Forecast the next day's value using Simple Moving Average
 * @param {Array<number>} historicalData - Array of historical values
 * @param {number} windowSize - Number of periods to include in the average (default: 7)
 * @returns {number|null} - The forecasted value or null if insufficient data
 */
export const forecastNextDay = (historicalData, windowSize = 7) => {
    return calculateSMA(historicalData, windowSize);
};

/**
 * Add forecast datasets to chart data
 * @param {Object} chartData - Existing chart data from transformDailyIncomeData
 * @param {number} collectedForecast - Forecasted value for collected income
 * @param {number} collectibleForecast - Forecasted value for collectible income
 * @returns {Object} - Updated chart data with forecast datasets
 */
export const addForecastToChartData = (chartData, collectedForecast, collectibleForecast) => {
    if (!chartData || !chartData.datasets) {
        return chartData;
    }

    const hasValidCollectedForecast = collectedForecast !== null && collectedForecast !== undefined && !isNaN(collectedForecast);
    const hasValidCollectibleForecast = collectibleForecast !== null && collectibleForecast !== undefined && !isNaN(collectibleForecast);

    if (!hasValidCollectedForecast && !hasValidCollectibleForecast) {
        // No valid forecasts to add
        return chartData;
    }

    // Add "Forecast" label at the end
    const updatedLabels = [...chartData.labels, 'Forecast'];

    // Update datasets with forecast values
    const updatedDatasets = chartData.datasets.map((dataset, index) => {
        // Clone the dataset
        const newDataset = { ...dataset };

        if (dataset.label === 'Collected Income' && hasValidCollectedForecast) {
            // Add null values except for the last actual data point and the forecast
            const lastValue = dataset.data[dataset.data.length - 1];
            newDataset.data = [
                ...dataset.data.slice(0, -1),
                lastValue,
                collectedForecast
            ];
        } else if (dataset.label === 'Collectible Income' && hasValidCollectibleForecast) {
            const lastValue = dataset.data[dataset.data.length - 1];
            newDataset.data = [
                ...dataset.data.slice(0, -1),
                lastValue,
                collectibleForecast
            ];
        } else if (dataset.label === 'Total Income') {
            // Calculate total forecast if both are available
            const totalForecast = (hasValidCollectedForecast ? collectedForecast : 0) +
                (hasValidCollectibleForecast ? collectibleForecast : 0);
            const lastValue = dataset.data[dataset.data.length - 1];
            newDataset.data = [
                ...dataset.data.slice(0, -1),
                lastValue,
                totalForecast
            ];
        }

        return newDataset;
    });

    // Add forecast-specific datasets with different styling
    const forecastDatasets = [];

    if (hasValidCollectedForecast) {
        const collectedDataset = chartData.datasets.find(ds => ds.label === 'Collected Income');
        if (collectedDataset) {
            const lastCollectedValue = collectedDataset.data[collectedDataset.data.length - 1];
            forecastDatasets.push({
                label: 'Collected Forecast',
                data: Array(chartData.labels.length).fill(null).concat([null, lastCollectedValue]).concat([collectedForecast]),
                borderColor: collectedDataset.borderColor,
                backgroundColor: collectedDataset.backgroundColor,
                tension: 0.4,
                fill: false,
                borderDash: [8, 4], // Distinct dashed pattern
                pointBackgroundColor: collectedDataset.borderColor,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                borderWidth: 2,
                // Make it semi-transparent to differentiate from actual data
                opacity: 0.7
            });
        }
    }

    if (hasValidCollectibleForecast) {
        const collectibleDataset = chartData.datasets.find(ds => ds.label === 'Collectible Income');
        if (collectibleDataset) {
            const lastCollectibleValue = collectibleDataset.data[collectibleDataset.data.length - 1];
            forecastDatasets.push({
                label: 'Collectible Forecast',
                data: Array(chartData.labels.length).fill(null).concat([null, lastCollectibleValue]).concat([collectibleForecast]),
                borderColor: collectibleDataset.borderColor,
                backgroundColor: collectibleDataset.backgroundColor,
                tension: 0.4,
                fill: false,
                borderDash: [8, 4], // Distinct dashed pattern
                pointBackgroundColor: collectibleDataset.borderColor,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                borderWidth: 2,
                opacity: 0.7
            });
        }
    }

    return {
        labels: updatedLabels,
        datasets: [...updatedDatasets, ...forecastDatasets]
    };
};

/**
 * Get forecast summary for display
 * @param {number} collectedForecast - Forecasted collected income
 * @param {number} collectibleForecast - Forecasted collectible income
 * @returns {Object} - Summary object with forecast values
 */
export const getForecastSummary = (collectedForecast, collectibleForecast) => {
    const hasCollected = collectedForecast !== null && !isNaN(collectedForecast);
    const hasCollectible = collectibleForecast !== null && !isNaN(collectibleForecast);

    return {
        collected: hasCollected ? collectedForecast : 0,
        collectible: hasCollectible ? collectibleForecast : 0,
        total: (hasCollected ? collectedForecast : 0) + (hasCollectible ? collectibleForecast : 0),
        hasData: hasCollected || hasCollectible
    };
};
