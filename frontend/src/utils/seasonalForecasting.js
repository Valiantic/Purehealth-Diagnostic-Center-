/**
 * Multiplicative Seasonal Forecasting Utility
 * 
 * Implements the formula: Ŷt = Tt × St
 * Where:
 *   Ŷt = Forecasted value at time t
 *   Tt = Trend component (linear regression)
 *   St = Seasonal index (day-of-week pattern)
 */

/**
 * Calculate linear regression parameters for trend component
 * @param {Array<number>} data - Array of numerical values
 * @returns {Object} - { slope, intercept } or null if insufficient data
 */
const calculateLinearRegression = (data) => {
    if (!Array.isArray(data) || data.length < 3) {
        return null;
    }

    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
        const x = i + 1; // Time index (1-based)
        const y = data[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) {
        return null;
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
};

/**
 * Calculate trend value at a specific time point
 * @param {Object} regression - { slope, intercept } from calculateLinearRegression
 * @param {number} t - Time index (1-based)
 * @returns {number} - Trend value at time t
 */
const getTrendValue = (regression, t) => {
    if (!regression) return null;
    return regression.intercept + regression.slope * t;
};

/**
 * Calculate seasonal indices for a 7-day weekly cycle
 * @param {Array<number>} data - Array of numerical values (should be multiple of 7 ideally)
 * @param {Object} regression - Linear regression parameters for detrending
 * @returns {Array<number>} - Array of 7 seasonal indices (normalized to average = 1)
 */
const calculateSeasonalIndices = (data, regression) => {
    if (!Array.isArray(data) || data.length < 7 || !regression) {
        return null;
    }

    const period = 7; // Weekly seasonality
    const seasonalSums = new Array(period).fill(0);
    const seasonalCounts = new Array(period).fill(0);

    // Calculate ratio of actual to trend for each data point
    for (let i = 0; i < data.length; i++) {
        const trendValue = getTrendValue(regression, i + 1);
        if (trendValue > 0 && data[i] !== null && data[i] !== undefined) {
            const ratio = data[i] / trendValue;
            const dayIndex = i % period;
            seasonalSums[dayIndex] += ratio;
            seasonalCounts[dayIndex]++;
        }
    }

    // Calculate average ratio for each day of the week
    const rawIndices = seasonalSums.map((sum, idx) => {
        return seasonalCounts[idx] > 0 ? sum / seasonalCounts[idx] : 1;
    });

    // Normalize so the average index equals 1
    const avgIndex = rawIndices.reduce((a, b) => a + b, 0) / period;
    const normalizedIndices = avgIndex > 0
        ? rawIndices.map(idx => idx / avgIndex)
        : rawIndices;

    return normalizedIndices;
};

/**
 * Forecast the next day's value using Multiplicative Seasonal Model
 * Formula: Ŷt = Tt × St
 * 
 * @param {Array<number>} historicalData - Array of historical values
 * @param {number} windowSize - Not used in seasonal model, kept for API compatibility
 * @returns {number|null} - The forecasted value or null if insufficient data
 */
export const forecastNextDay = (historicalData, windowSize = 7) => {
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
        return null;
    }

    // Filter out null/undefined values and convert to numbers
    const validData = historicalData
        .filter(val => val !== null && val !== undefined && !isNaN(val))
        .map(val => parseFloat(val));

    // Minimum 14 days for seasonal forecasting (need at least 2 complete weeks)
    const MIN_DATA_FOR_SEASONAL = 14;

    if (validData.length < MIN_DATA_FOR_SEASONAL) {
        // Fall back to Simple Moving Average if insufficient data
        return calculateSMA(validData, windowSize);
    }

    // Step 1: Calculate trend component using linear regression
    const regression = calculateLinearRegression(validData);
    if (!regression) {
        return calculateSMA(validData, windowSize);
    }

    // Step 2: Calculate seasonal indices
    const seasonalIndices = calculateSeasonalIndices(validData, regression);
    if (!seasonalIndices) {
        return calculateSMA(validData, windowSize);
    }

    // Step 3: Forecast next day
    // Next time index is length + 1
    const nextTimeIndex = validData.length + 1;

    // Get trend value for next day
    const trendForecast = getTrendValue(regression, nextTimeIndex);

    // Get seasonal index for next day
    // The day index is based on position in the weekly cycle
    const nextDayIndex = validData.length % 7;
    const seasonalIndex = seasonalIndices[nextDayIndex];

    // Apply multiplicative seasonal formula: Ŷt = Tt × St
    const forecast = trendForecast * seasonalIndex;

    // Ensure forecast is non-negative
    return Math.max(0, forecast);
};

/**
 * Simple Moving Average (SMA) - Fallback function
 * Used when insufficient data for seasonal forecasting
 * 
 * @param {Array<number>} data - Array of numerical values
 * @param {number} windowSize - Number of periods to average (default: 7)
 * @returns {number|null} - The SMA value or null
 */
export const calculateSMA = (data, windowSize = 7) => {
    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    // Filter and validate data
    const validData = data
        .filter(val => val !== null && val !== undefined && !isNaN(val))
        .map(val => parseFloat(val));

    if (validData.length < Math.min(3, windowSize)) {
        return null;
    }

    // Use effective window or all data if less available
    const effectiveWindow = Math.min(windowSize, validData.length);
    const recentData = validData.slice(-effectiveWindow);

    const sum = recentData.reduce((acc, val) => acc + val, 0);
    return sum / recentData.length;
};

/**
 * Forecast multiple days ahead using Multiplicative Seasonal Model
 * 
 * @param {Array<number>} historicalData - Array of historical values  
 * @param {number} daysAhead - Number of days to forecast (default: 1)
 * @returns {Array<number>} - Array of forecasted values
 */
export const forecastMultipleDays = (historicalData, daysAhead = 1) => {
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
        return [];
    }

    const validData = historicalData
        .filter(val => val !== null && val !== undefined && !isNaN(val))
        .map(val => parseFloat(val));

    const forecasts = [];

    for (let i = 0; i < daysAhead; i++) {
        // For each forecast, extend the data with previous forecasts
        const extendedData = [...validData, ...forecasts];
        const nextForecast = forecastNextDay(extendedData);
        if (nextForecast !== null) {
            forecasts.push(nextForecast);
        }
    }

    return forecasts;
};

/**
 * Get forecast summary with model information
 * 
 * @param {number} collectedForecast - Forecasted collected income
 * @param {number} collectibleForecast - Forecasted collectible income
 * @returns {Object} - Summary object
 */
export const getForecastSummary = (collectedForecast, collectibleForecast) => {
    const hasCollected = collectedForecast !== null && !isNaN(collectedForecast);
    const hasCollectible = collectibleForecast !== null && !isNaN(collectibleForecast);

    return {
        collected: hasCollected ? collectedForecast : 0,
        collectible: hasCollectible ? collectibleForecast : 0,
        total: (hasCollected ? collectedForecast : 0) + (hasCollectible ? collectibleForecast : 0),
        hasData: hasCollected || hasCollectible,
        model: 'multiplicative_seasonal'
    };
};

/**
 * Analyze seasonal patterns in data (for debugging/display purposes)
 * 
 * @param {Array<number>} data - Array of historical values
 * @returns {Object|null} - Seasonal analysis or null
 */
export const analyzeSeasonality = (data) => {
    if (!Array.isArray(data) || data.length < 14) {
        return null;
    }

    const validData = data
        .filter(val => val !== null && val !== undefined && !isNaN(val))
        .map(val => parseFloat(val));

    const regression = calculateLinearRegression(validData);
    if (!regression) return null;

    const seasonalIndices = calculateSeasonalIndices(validData, regression);
    if (!seasonalIndices) return null;

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return {
        trend: {
            slope: regression.slope,
            intercept: regression.intercept,
            direction: regression.slope > 0 ? 'increasing' : regression.slope < 0 ? 'decreasing' : 'stable'
        },
        seasonalIndices: dayNames.map((name, idx) => ({
            day: name,
            index: seasonalIndices[idx],
            interpretation: seasonalIndices[idx] > 1.1 ? 'high'
                : seasonalIndices[idx] < 0.9 ? 'low'
                    : 'average'
        })),
        dataPoints: validData.length
    };
};
