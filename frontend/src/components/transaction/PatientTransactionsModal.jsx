import React from 'react';
import { X, Save } from 'lucide-react';

/**
 * PatientTransactionsModal
 * Shows all transactions belonging to a single patient name group.
 * Each row has Edit / Cancel actions identical to the main table.
 */
const PatientTransactionsModal = ({
    isOpen,
    patientName,
    transactions = [],
    departmentsWithValues = [],
    editingId,
    editedTransaction,
    openMenuId,
    referrers = [],
    handlers = {},
    permissions = {},
    onClose,
}) => {
    if (!isOpen) return null;

    const {
        handleEditClick,
        handleCancelClick,
        handleEditChange,
        handleSaveClick,
        handleCancelInlineEdit,
        toggleIncomeMenu,
    } = handlers;

    const fmt = (n) =>
        (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-green-800 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold tracking-wide">Patient Transactions</h2>
                        <p className="text-green-200 text-sm mt-0.5">{patientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-green-200 transition-colors p-1 rounded-md hover:bg-green-700"
                        aria-label="Close"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1">
                    <table className="min-w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-green-700 text-white">
                                <th className="py-2 px-3 text-left border border-green-600 uppercase tracking-wide whitespace-nowrap">OR#</th>
                                {departmentsWithValues.map((dept) => (
                                    <th
                                        key={dept.departmentId}
                                        className="py-2 px-3 text-right border border-green-600 uppercase tracking-wide whitespace-nowrap"
                                    >
                                        {dept.departmentName}
                                    </th>
                                ))}
                                <th className="py-2 px-3 text-right border border-green-600 uppercase tracking-wide whitespace-nowrap">Gross</th>
                                <th className="py-2 px-3 text-left border border-green-600 uppercase tracking-wide whitespace-nowrap">Referrer</th>
                                <th className="py-2 px-3 text-left border border-green-600 uppercase tracking-wide whitespace-nowrap">Status</th>
                                <th className="py-2 px-3 text-center border border-green-600 uppercase tracking-wide whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((txn) => {
                                const isCancelled = txn.status === 'cancelled';
                                const isEditing = editingId === txn.id;

                                return (
                                    <tr
                                        key={txn.id}
                                        className={isCancelled ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-green-50'}
                                    >
                                        {/* OR# */}
                                        <td className="py-2 px-3 border border-green-100 font-mono text-xs whitespace-nowrap">
                                            {txn.id}
                                        </td>

                                        {/* Department amounts */}
                                        {departmentsWithValues.map((dept) => {
                                            const deptData = txn.departmentRevenues?.[dept.departmentId];
                                            return (
                                                <td key={dept.departmentId} className="py-2 px-3 border border-green-100 text-right whitespace-nowrap">
                                                    {isCancelled
                                                        ? <span className="text-xs text-gray-400">—</span>
                                                        : deptData?.amount > 0
                                                            ? fmt(deptData.amount)
                                                            : <span className="text-gray-300 text-xs">N/A</span>
                                                    }
                                                </td>
                                            );
                                        })}

                                        {/* Gross */}
                                        <td className="py-2 px-3 border border-green-100 text-right font-semibold whitespace-nowrap">
                                            {isCancelled ? '—' : fmt(txn.grossDeposit)}
                                        </td>

                                        {/* Referrer */}
                                        <td className="py-2 px-3 border border-green-100 text-sm whitespace-nowrap">
                                            {isEditing ? (
                                                <select
                                                    value={editedTransaction?.referrerId ?? ''}
                                                    onChange={(e) => handleEditChange(e, 'referrerId')}
                                                    className="w-full border border-green-500 rounded px-1 py-1 text-xs focus:outline-none"
                                                >
                                                    <option value="">Out Patient</option>
                                                    {referrers.map((r) => (
                                                        <option key={r.referrerId} value={r.referrerId}>Dr. {r.lastName}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                txn.referrer || 'Out Patient'
                                            )}
                                        </td>

                                        {/* Status badge */}
                                        <td className="py-2 px-3 border border-green-100 whitespace-nowrap">
                                            {isCancelled
                                                ? <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Cancelled</span>
                                                : <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                                            }
                                        </td>

                                        {/* Actions */}
                                        <td className="py-2 px-3 border border-green-100 text-center whitespace-nowrap">
                                            {!isCancelled && (
                                                isEditing ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleSaveClick(txn)}
                                                            className="text-green-600 hover:text-green-800 p-1"
                                                            title="Save"
                                                        >
                                                            <Save size={15} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelInlineEdit}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                            title="Discard"
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center gap-1">
                                                        {permissions.canEdit && (
                                                            <button
                                                                onClick={() => handleEditClick(txn, true)}
                                                                className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                        {permissions.canCancel && (
                                                            <button
                                                                onClick={() => { handleCancelClick(txn); onClose(); }}
                                                                className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                        {!permissions.canEdit && !permissions.canCancel && (
                                                            <button
                                                                onClick={() => handleEditClick(txn, false)}
                                                                className="px-2 py-1 text-xs rounded bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors"
                                                            >
                                                                View
                                                            </button>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                        {/* Totals footer */}
                        <tfoot>
                            <tr className="bg-green-100 font-bold">
                                <td className="py-2 px-3 border border-green-200 text-green-800">TOTAL</td>
                                {departmentsWithValues.map((dept) => {
                                    const total = transactions
                                        .filter(t => t.status !== 'cancelled')
                                        .reduce((s, t) => s + (t.departmentRevenues?.[dept.departmentId]?.amount || 0), 0);
                                    return (
                                        <td key={dept.departmentId} className="py-2 px-3 border border-green-200 text-right">
                                            {total > 0 ? fmt(total) : '—'}
                                        </td>
                                    );
                                })}
                                <td className="py-2 px-3 border border-green-200 text-right text-green-700">
                                    {fmt(transactions.filter(t => t.status !== 'cancelled').reduce((s, t) => s + (t.grossDeposit || 0), 0))}
                                </td>
                                <td colSpan={3} className="border border-green-200" />
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50">
                    <span className="text-sm text-gray-500">
                        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found for this patient
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-green-800 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientTransactionsModal;
