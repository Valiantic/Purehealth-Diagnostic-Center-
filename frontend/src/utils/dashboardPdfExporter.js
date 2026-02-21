import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Colors ───────────────────────────────────────────────────────────────
const C = {
    greenDark: [22, 101, 52],
    greenMid: [21, 128, 61],
    greenLight: [220, 252, 231],
    redDark: [185, 28, 28],
    redLight: [254, 226, 226],
    gray900: [17, 24, 39],
    gray600: [75, 85, 99],
    gray200: [229, 231, 235],
    gray100: [243, 244, 246],
    white: [255, 255, 255],
};

// ─── Helpers ─────────────────────────────────────────────────────────────
const fmt = (val) =>
    'P' + parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (v) => (v != null ? Math.abs(parseFloat(v)).toFixed(2) + '%' : '—');

const paint = (doc, color, type = 'fill') => {
    if (type === 'fill') doc.setFillColor(...color);
    if (type === 'text') doc.setTextColor(...color);
    if (type === 'draw') doc.setDrawColor(...color);
};

async function snap(id, opts = {}) {
    const el = document.getElementById(id);
    if (!el) return null;
    const ovf = el.style.overflow, wd = el.style.width;
    if (opts.w) { el.style.overflow = 'hidden'; el.style.width = opts.w + 'px'; }
    const cv = await html2canvas(el, {
        scale: 2.5, useCORS: true, allowTaint: false,
        backgroundColor: '#ffffff', logging: false,
        width: opts.w || el.offsetWidth,
    });
    if (opts.w) { el.style.overflow = ovf; el.style.width = wd; }
    return { url: cv.toDataURL('image/jpeg', 0.95), ar: cv.height / cv.width };
}

// ─── Page constants ───────────────────────────────────────────────────────
const PW = 210;
const PH = 297;
const ML = 14;
const CW = PW - ML * 2;   // 182 mm usable width
const HDR = 18;             // header height
const FTR = 10;             // footer height
const BODY = PH - HDR - FTR; // 269 mm body

// ─── Page chrome ──────────────────────────────────────────────────────────
function header(doc, period, label) {
    paint(doc, C.greenDark);
    doc.rect(0, 0, PW, HDR, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    paint(doc, C.white, 'text');
    doc.text('PUREHEALTH DIAGNOSTIC CENTER', ML, 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    paint(doc, [187, 247, 208], 'text');
    doc.text(`Monthly Dashboard Report  -  ${period}`, ML, 14);
    doc.text(label, PW - ML, 14, { align: 'right' });
}

function footer(doc) {
    const d = new Date();
    paint(doc, C.gray100);
    doc.rect(0, PH - FTR, PW, FTR, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    paint(doc, C.gray600, 'text');
    doc.text(
        `Purehealth Diagnostic Center  -  Confidential  -  Generated ${d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        PW / 2, PH - 3.5, { align: 'center' }
    );
}

// ─── Section block ────────────────────────────────────────────────────────
// Layout: [left: card screenshot box] | [right: title badge + analysis lines]
// All text is clipped to the analysis lines array — max 7 short lines.

function section(doc, by, secH, img, accent, title, numStr, lines) {
    const bx = ML;
    const IMG_W = 72;           // screenshot column width
    const IMG_PAD = 4;
    const TXT_X = bx + IMG_W + IMG_PAD + 6;
    const TXT_W = CW - IMG_W - IMG_PAD - 8;

    // section bg
    paint(doc, [248, 250, 252]);
    doc.roundedRect(bx, by, CW, secH, 2, 2, 'F');

    // accent strip
    paint(doc, accent);
    doc.roundedRect(bx, by, 3, secH, 1, 1, 'F');

    // watermark number
    doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
    paint(doc, C.gray200, 'text');
    doc.text(numStr, bx + CW - 4, by + secH - 5, { align: 'right' });

    // image box
    const imgBoxX = bx + IMG_PAD;
    const imgBoxY = by + IMG_PAD;
    const imgBoxW = IMG_W;
    const imgBoxH = secH - IMG_PAD * 2;

    paint(doc, C.white);
    doc.roundedRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 2, 2, 'F');
    paint(doc, [209, 213, 219], 'draw');
    doc.setLineWidth(0.18);
    doc.roundedRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 2, 2, 'S');

    if (img) {
        const rawH = imgBoxW * img.ar;
        const finalH = Math.min(rawH, imgBoxH - 4);
        const finalW = finalH / img.ar;
        const ix = imgBoxX + (imgBoxW - finalW) / 2;
        const iy = imgBoxY + (imgBoxH - finalH) / 2;
        doc.addImage(img.url, 'JPEG', ix, iy, finalW, finalH);
    } else {
        const [r, g, b] = accent;
        doc.setFillColor(r, g, b);
        doc.roundedRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        paint(doc, C.white, 'text');
        doc.text(title, imgBoxX + imgBoxW / 2, by + secH / 2, { align: 'center' });
    }

    // vertical divider
    paint(doc, [209, 213, 219], 'draw');
    doc.setLineWidth(0.22);
    doc.line(TXT_X - 3, by + 7, TXT_X - 3, by + secH - 7);

    // title badge
    const badgeTxt = title.toUpperCase();
    const badgeW = Math.min(doc.getTextWidth(badgeTxt) + 8, TXT_W);
    const [ar, ag, ab] = accent;
    doc.setFillColor(ar, ag, ab);
    doc.roundedRect(TXT_X, by + 6, badgeW, 6.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    paint(doc, C.white, 'text');
    doc.text(badgeTxt, TXT_X + 4, by + 11);

    // analysis lines — each line is rendered individually, max 7
    doc.setFont('helvetica', 'normal');
    paint(doc, C.gray900, 'text');
    const LINE_H = (secH - 6.5 - 8 - 8) / 7; // dynamic line height based on section height
    lines.slice(0, 7).forEach((line, i) => {
        const fontSize = line.startsWith('*') ? 7 : 7.8;
        doc.setFontSize(fontSize);
        const txt = line.startsWith('*') ? line.slice(1) : line;
        if (txt === '') return;
        const wrapped = doc.splitTextToSize(txt, TXT_W);
        wrapped.slice(0, 2).forEach((wl, wi) => {
            doc.text(wl, TXT_X, by + 20 + (i + wi) * LINE_H);
        });
    });
}

// ─── Full-width chart section (pages 4 & 5) ───────────────────────────────
function chartPage(doc, img, accent, title, numStr, lines, imgHeightMm) {
    const BY = HDR + 4; // content starts just after header

    // title badge
    const badgeTxt = title.toUpperCase();
    const badgeW = Math.min(doc.getTextWidth(badgeTxt) + 8, 80);
    const [ar, ag, ab] = accent;
    doc.setFillColor(ar, ag, ab);
    doc.roundedRect(ML, BY, badgeW, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    paint(doc, C.white, 'text');
    doc.text(badgeTxt, ML + 4, BY + 5);

    // screenshot
    const imgY = BY + 10;
    if (img) {
        const rawH = CW * img.ar;
        const h = Math.min(rawH, imgHeightMm);
        doc.addImage(img.url, 'JPEG', ML, imgY, CW, h);
    }

    // analysis box below image
    const expY = imgY + imgHeightMm + 4;
    const expH = PH - FTR - expY - 2;

    paint(doc, [248, 250, 252]);
    doc.roundedRect(ML, expY, CW, expH, 2, 2, 'F');
    const [br, bg, bb] = accent;
    doc.setFillColor(br, bg, bb);
    doc.roundedRect(ML, expY, 3, expH, 1, 1, 'F');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    paint(doc, accent, 'text');
    doc.text('What the data shows:', ML + 7, expY + 8);

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6);
    paint(doc, C.gray900, 'text');
    let ly = expY + 15;
    lines.forEach((line) => {
        if (!line || line === '') { ly += 1.5; return; }
        const w = doc.splitTextToSize(line, CW - 12);
        w.forEach((wl) => { doc.text(wl, ML + 7, ly); ly += 4.6; });
    });

    // watermark
    doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
    paint(doc, C.gray200, 'text');
    doc.text(numStr, ML + CW - 4, expY + expH - 5, { align: 'right' });
}

// ─── Data-driven text generators ─────────────────────────────────────────

function revenueLines(m, date) {
    const comp = m.revenueComparison;
    const dir = comp?.direction;
    const p = pct(comp?.percentage);
    const trend = dir === 'up'
        ? `Revenue went UP by ${p} compared to last month.`
        : dir === 'down'
            ? `Revenue went DOWN by ${p} compared to last month.`
            : 'No comparison data available for last month.';

    return [
        `Total collected from patients in ${date}: ${fmt(m.monthlyRevenue)}.`,
        trend,
        dir === 'up'
            ? 'The clinic served more patients or higher-value services this month.'
            : dir === 'down'
                ? 'Fewer patients or lower-value services compared to last month.'
                : '',
    ].filter(Boolean);
}

function expenseLines(m, date) {
    const comp = m.expensesComparison;
    const dir = comp?.direction;
    const p = pct(comp?.percentage);
    const top = Array.isArray(m.expensesByDepartment) && m.expensesByDepartment.length > 0
        ? m.expensesByDepartment[0]
        : null;
    const topLabel = top ? (top.category || top.department || 'Unknown') : null;

    const lines = [
        `Total clinic spending in ${date}: ${fmt(m.monthlyExpenses)}.`,
        dir === 'up'
            ? `Costs went UP by ${p} from last month.`
            : dir === 'down'
                ? `Costs went DOWN by ${p} from last month.`
                : 'No comparison available for last month.',
    ];
    if (topLabel) lines.push(`Biggest expense category this month: ${topLabel}.`);
    return lines;
}

function txLines(m, date) {
    const comp = m.transactionComparison;
    const dir = comp?.direction;
    const p = pct(comp?.percentage);
    return [
        `Total completed patient visits in ${date}: ${m.transactionCount ?? '—'}.`,
        dir === 'up'
            ? `Patient visits went UP by ${p} from last month.`
            : dir === 'down'
                ? `Patient visits went DOWN by ${p} from last month.`
                : 'No comparison available for last month.',
        'Cancelled visits are excluded from this count.',
    ];
}

function profitLines(m, date) {
    const isLoss = (m.netProfit ?? 0) < 0;
    const comp = m.netProfitComparison;
    const dir = comp?.direction;
    const p = pct(comp?.percentage);

    const lines = [
        `${isLoss ? 'Net Loss' : 'Net Profit'} in ${date}: ${fmt(m.netProfit)}.`,
        isLoss
            ? 'The clinic spent more than it collected this month.'
            : 'The clinic earned more than it spent this month.',
    ];
    if (dir) {
        lines.push(
            dir === 'up'
                ? `Profit improved by ${p} compared to last month.`
                : `Profit decreased by ${p} compared to last month.`
        );
    }
    return lines;
}

function progressLines(m) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const pctDone = Math.round((currentDay / daysInMonth) * 100);
    const monthName = now.toLocaleString('default', { month: 'long' });

    // Compare revenue pace
    const revPerDay = parseFloat(m.monthlyRevenue || 0) / currentDay;
    const projectedRev = revPerDay * daysInMonth;

    return [
        `${currentDay} out of ${daysInMonth} days of ${monthName} have passed (${pctDone}%).`,
        `At the current daily rate, projected monthly revenue: ${fmt(projectedRev)}.`,
        pctDone >= 75
            ? 'The month is almost over. Final revenue figures are close to actual.'
            : 'There are still several days remaining — revenue may still change.',
    ];
}

function categoryLines(m) {
    const cats = Array.isArray(m.expensesByDepartment) ? m.expensesByDepartment : [];
    if (cats.length === 0) return ['No expense category data recorded this month.'];
    const total = cats.reduce((s, c) => s + (c.amount || 0), 0);
    const lines = [`Total spending broken down across ${cats.length} category/ies.`];
    cats.slice(0, 4).forEach((c) => {
        const label = c.category || c.department || 'Unknown';
        const share = total > 0 ? Math.round((c.amount / total) * 100) : 0;
        lines.push(`${label}: ${fmt(c.amount)} (${share}% of total expenses).`);
    });
    if (cats.length > 4) lines.push(`...and ${cats.length - 4} more categories.`);
    return lines;
}

function incomeTrendLines(m, date) {
    // dailyIncomeData items: { day, dayName, amount (collected), collectibleAmount }
    const data = Array.isArray(m.dailyIncomeData) ? m.dailyIncomeData : [];
    if (data.length === 0) return [`No daily income data available for ${date}.`];

    const sorted = [...data].sort((a, b) => a.day - b.day);

    // total per day = collected (amount) + outstanding (collectibleAmount)
    const totalPerDay = sorted.map(d => (parseFloat(d.amount) || 0) + (parseFloat(d.collectibleAmount) || 0));
    const maxTotal = Math.max(...totalPerDay);
    const maxIdx = totalPerDay.indexOf(maxTotal);
    const peakDay = sorted[maxIdx]?.dayName || `Day ${sorted[maxIdx]?.day || maxIdx + 1}`;

    const totalCollected = sorted.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
    const totalCollectible = sorted.reduce((s, d) => s + (parseFloat(d.collectibleAmount) || 0), 0);
    const grandTotal = totalCollected + totalCollectible;

    return [
        `Peak income day this month: ${peakDay} with ${fmt(maxTotal)}.`,
        `Total billed so far: ${fmt(grandTotal)}.`,
        `Already collected: ${fmt(totalCollected)}.`,
        totalCollectible > 0
            ? `Still pending collection from patients: ${fmt(totalCollectible)}.`
            : 'All billed income for this period has already been collected.',
    ];
}

function plLines(m) {
    // monthlyProfitData shape: { currentYear, previousYear, combined: [{month, year, revenue, expenses, profit}] }
    const combined = m.monthlyProfitData?.combined;
    if (!Array.isArray(combined) || combined.length === 0) return ['No monthly trend data available.'];

    // Only consider months that have actual revenue or expense data
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const active = combined.filter(d => (parseFloat(d.revenue) || 0) > 0 || (parseFloat(d.expenses) || 0) > 0);
    if (active.length === 0) return ['No recorded revenue or expenses in the trend data.'];

    const profitMonths = active.filter(d => (parseFloat(d.profit) || 0) > 0).length;
    const lossMonths = active.filter(d => (parseFloat(d.profit) || 0) < 0).length;
    const profits = active.map(d => parseFloat(d.profit) || 0);
    const highest = Math.max(...profits);
    const lowest = Math.min(...profits);
    const bestItem = active[profits.indexOf(highest)];
    const worstItem = active[profits.indexOf(lowest)];
    const bestLabel = bestItem ? `${shortMonths[(bestItem.month || 1) - 1]} ${bestItem.year}` : '';
    const worstLabel = worstItem ? `${shortMonths[(worstItem.month || 1) - 1]} ${worstItem.year}` : '';

    const lines = [
        `${active.length} months with data:  ${profitMonths} profitable, ${lossMonths} with a loss.`,
    ];
    if (highest > 0) lines.push(`Best month: ${bestLabel} — net profit of ${fmt(highest)}.`);
    if (lowest < 0) lines.push(`Worst month: ${worstLabel} — net loss of ${fmt(Math.abs(lowest))}.`);
    lines.push(
        profitMonths > lossMonths
            ? 'Overall the clinic has been profitable for most recorded months.'
            : lossMonths > profitMonths
                ? 'More loss months than profit months — expenses may need review.'
                : 'Equal profit and loss months — financial performance is mixed.'
    );
    return lines;
}

// ─── Main export ─────────────────────────────────────────────────────────

export const exportDashboardPdf = async (_el, metrics, formattedDate) => {
    const m = metrics;
    const isLoss = (m.netProfit ?? 0) < 0;

    // Capture screenshots in parallel
    const [revImg, expImg, txImg, npImg, progImg, catImg, trendImg, plImg] =
        await Promise.all([
            snap('kpi-total-revenue'),
            snap('kpi-operating-cost'),
            snap('kpi-total-transactions'),
            snap('kpi-net-profit'),
            snap('kpi-monthly-progress'),
            snap('kpi-expenses-by-category'),
            snap('kpi-income-trend'),
            snap('kpi-profit-loss', { w: 900 }),
        ]);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const TOTAL = 5;

    // ── SEC_H calculation ────────────────────────────────────────────────
    // Body = 269mm, start Y = HDR+4 = 22, bottom = PH-FTR-4 = 283
    // Available = 283 - 22 = 261mm for two sections + gap
    const GAP = 5;
    const SEC_H = Math.floor((261 - GAP) / 2); // = 128 mm each

    const drawPair = (pageNum, s1, s2) => {
        if (pageNum > 1) doc.addPage();
        header(doc, formattedDate, `${pageNum} / ${TOTAL}`);
        footer(doc);
        const startY = HDR + 4;
        section(doc, startY, SEC_H, s1.img, s1.accent, s1.title, s1.num, s1.lines);
        section(doc, startY + SEC_H + GAP, SEC_H, s2.img, s2.accent, s2.title, s2.num, s2.lines);
    };

    // Page 1 — Total Revenue + Operating Cost
    drawPair(1,
        { img: revImg, accent: C.greenDark, title: 'Total Revenue', num: '01', lines: revenueLines(m, formattedDate) },
        { img: expImg, accent: C.greenMid, title: 'Operating Cost', num: '02', lines: expenseLines(m, formattedDate) }
    );

    // Page 2 — Total Transactions + Net Profit/Loss
    drawPair(2,
        { img: txImg, accent: C.greenDark, title: 'Total Transactions', num: '03', lines: txLines(m, formattedDate) },
        { img: npImg, accent: isLoss ? C.redDark : C.greenDark, title: isLoss ? 'Net Loss' : 'Net Profit', num: '04', lines: profitLines(m, formattedDate) }
    );

    // Page 3 — Monthly Progress + Expenses by Category
    drawPair(3,
        { img: progImg, accent: C.greenDark, title: 'Monthly Progress', num: '05', lines: progressLines(m) },
        { img: catImg, accent: C.greenMid, title: 'Expenses by Category', num: '06', lines: categoryLines(m) }
    );

    // Page 4 — Income Trend (full-width)
    doc.addPage();
    header(doc, formattedDate, `4 / ${TOTAL}`);
    footer(doc);
    chartPage(doc, trendImg, C.greenDark, 'Income Trend', '07', incomeTrendLines(m, formattedDate), 88);

    // Page 5 — Monthly Profit & Loss (full-width)
    doc.addPage();
    header(doc, formattedDate, `5 / ${TOTAL}`);
    footer(doc);
    chartPage(doc, plImg, C.greenDark, 'Monthly Profit and Loss', '08', plLines(m), 82);

    // Save
    doc.save(`Purehealth_Dashboard_${formattedDate.replace(/\s/g, '_')}.pdf`);
};
