import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CirclePlus, MoreVertical } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import useAuth from '../hooks/auth/useAuth';
import usePermissions from '../hooks/auth/usePermissions';
import CollectibleIncomeModal from '../components/monthly-income/CollectiblesIncomeModals';
import { collectibleIncomeAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CollectibleIncome = () => {
    const { user, isAuthenticating } = useAuth();
    const { hasPermission } = usePermissions();

    const [isCollectibleModalOpen, setIsCollectibleModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedCollectible, setSelectedCollectible] = useState(null);
    const [collectibles, setCollectibles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        return { month: now.getMonth() + 1, year: now.getFullYear() };
    });

    const [currentMonth, setCurrentMonth] = useState('');

    useEffect(() => {
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        setCurrentMonth(`${monthNames[currentDate.month - 1]}-${currentDate.year}`);
        fetchCollectibles();
    }, [currentDate.month, currentDate.year, currentPage]);

    const fetchCollectibles = async () => {
        setLoading(true);
        try {
            const response = await collectibleIncomeAPI.getAllCollectibleIncome();
            if (response?.data?.success) {
                const allData = response.data.data || [];
                const filtered = allData.filter(item => {
                    const d = new Date(item.dateConducted);
                    return d.getMonth() + 1 === currentDate.month && d.getFullYear() === currentDate.year;
                });
                setTotalPages(Math.ceil(filtered.length / itemsPerPage));
                const start = (currentPage - 1) * itemsPerPage;
                setCollectibles(filtered.slice(start, start + itemsPerPage));
            } else {
                toast.error('Failed to fetch collectible income data');
                setCollectibles([]);
            }
        } catch (err) {
            toast.error(`Error loading collectible income: ${err.message}`);
            setCollectibles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCollectibles = () => {
        setModalMode('add');
        setSelectedCollectible(null);
        setIsCollectibleModalOpen(true);
    };

    const handleEditCollectible = (item) => {
        setModalMode('edit');
        setSelectedCollectible(item);
        setIsCollectibleModalOpen(true);
        setActiveMenu(null);
    };

    const handleCollectibleSubmit = async (data) => {
        setLoading(true);
        try {
            const payload = { ...data, currentUserId: user?.userId || user?.id };
            const response = await collectibleIncomeAPI.createCollectibleIncome(payload);
            if (response?.data?.success) {
                toast.success('Collectible income added successfully');
                await fetchCollectibles();
            } else {
                toast.error(response?.data?.message || 'Failed to add collectible income');
            }
        } catch (err) {
            toast.error(`Error: ${err.message || 'An unknown error occurred'}`);
        } finally {
            setLoading(false);
            setIsCollectibleModalOpen(false);
        }
    };

    const handleCollectibleUpdate = async (data) => {
        setLoading(true);
        try {
            const payload = { ...data, currentUserId: user?.userId || user?.id };
            const response = await collectibleIncomeAPI.updateCollectibleIncome(selectedCollectible.companyId, payload);
            if (response?.data?.success) {
                toast.success('Collectible income updated successfully');
                await fetchCollectibles();
            } else {
                toast.error(response?.data?.message || 'Failed to update collectible income');
            }
        } catch (err) {
            toast.error(`Error: ${err.message || 'An unknown error occurred'}`);
        } finally {
            setLoading(false);
            setIsCollectibleModalOpen(false);
            setSelectedCollectible(null);
        }
    };

    const toggleMenu = (id) => setActiveMenu(activeMenu === id ? null : id);

    const handlePrevMonth = () => {
        setCurrentPage(1);
        setCurrentDate(prev => ({
            month: prev.month === 1 ? 12 : prev.month - 1,
            year: prev.month === 1 ? prev.year - 1 : prev.year,
        }));
    };

    const handleNextMonth = () => {
        setCurrentPage(1);
        setCurrentDate(prev => ({
            month: prev.month === 12 ? 1 : prev.month + 1,
            year: prev.month === 12 ? prev.year + 1 : prev.year,
        }));
    };

    const formatCurrency = (v) =>
        parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const monthTotal = collectibles.reduce((s, i) => s + parseFloat(i.totalIncome || 0), 0);

    if (isAuthenticating || !user) return null;

    return (
        <div className="flex flex-col md:flex-row h-screen bg-cream-50">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />

            <div className="md:sticky md:top-0 md:h-screen z-10">
                <Sidebar />
            </div>

            <div className="flex-1 overflow-auto p-4 pt-16 lg:pt-6 lg:ml-64">
                <div className="bg-cream-50 border-green-800 rounded">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-gray-800">Collectible Income</h1>
                    </div>

                    {/* Month navigation */}
                    <div className="flex justify-center items-center py-2 mb-4">
                        <div className="flex border border-green-800 rounded overflow-hidden">
                            <button
                                onClick={handlePrevMonth}
                                className="bg-green-800 font-bold text-white px-2 py-2 flex items-center justify-center"
                            >
                                <ChevronLeft size={20} color="white" />
                            </button>
                            <div className="px-4 py-1 font-medium border-l border-r border-green-800 text-green-800">
                                {currentMonth}
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="bg-green-800 font-bold text-white px-2 py-2 flex items-center justify-center"
                            >
                                <ChevronRight size={20} color="white" />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {hasPermission('collectible.view') ? (
                        <div className="p-2">
                            <div className="bg-green-800 text-white p-2 font-semibold rounded-t flex justify-between items-center">
                                <span>Collectible Income — {currentMonth}</span>
                                {hasPermission('collectible.create') && (
                                    <button
                                        onClick={handleAddCollectibles}
                                        className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                    >
                                        <CirclePlus />
                                    </button>
                                )}
                            </div>

                            <div className="border border-green-800 rounded-b">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-green-800 bg-green-100">
                                                <th className="p-2 border-r border-green-800 text-left uppercase tracking-wide">Company</th>
                                                <th className="p-2 border-r border-green-800 text-left uppercase tracking-wide">Coordinator</th>
                                                <th className="p-2 border-r border-green-800 text-center uppercase tracking-wide">Date</th>
                                                <th className="p-2 border-r border-green-800 text-right uppercase tracking-wide">Income</th>
                                                {hasPermission('collectible.edit') && (
                                                    <th className="p-2 border-r border-green-800 text-center uppercase tracking-wide">Actions</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={hasPermission('collectible.edit') ? 5 : 4} className="p-4 text-center bg-white">
                                                        Loading...
                                                    </td>
                                                </tr>
                                            ) : collectibles.length > 0 ? (
                                                collectibles.map((item) => (
                                                    <tr key={`ci-${item.companyId}-${item.dateConducted}`} className="border-b border-green-200">
                                                        <td className="p-3 border-r border-green-200 text-left bg-white">{item.companyName}</td>
                                                        <td className="p-3 border-r border-green-200 text-left bg-white">{item.coordinatorName}</td>
                                                        <td className="p-3 border-r border-green-200 text-center bg-white">
                                                            {new Date(item.dateConducted).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-3 border-r border-green-200 text-right bg-white">
                                                            {formatCurrency(item.totalIncome)}
                                                        </td>
                                                        {hasPermission('collectible.edit') && (
                                                            <td className="p-3 text-center relative bg-white">
                                                                <button
                                                                    className="text-green-800 hover:text-green-600 p-1"
                                                                    onClick={() => toggleMenu(item.companyId)}
                                                                >
                                                                    <MoreVertical size={20} />
                                                                </button>
                                                                {activeMenu === item.companyId && (
                                                                    <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                                                        <ul className="py-1">
                                                                            <li>
                                                                                <button
                                                                                    onClick={() => handleEditCollectible(item)}
                                                                                    className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-100"
                                                                                >
                                                                                    Edit
                                                                                </button>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={hasPermission('collectible.edit') ? 5 : 4} className="p-4 text-center text-gray-500 bg-white">
                                                        No collectible income records found for {currentMonth}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-green-800 bg-green-100 font-bold">
                                                <td colSpan={hasPermission('collectible.edit') ? 3 : 2} className="p-2 border-r border-green-800 text-right">
                                                    Page Total:
                                                </td>
                                                <td className="p-2 border-r border-green-800 text-right">{formatCurrency(monthTotal)}</td>
                                                {hasPermission('collectible.edit') && <td />}
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="flex justify-between items-center p-2 border-t border-green-800 bg-green-100">
                                    <span className="text-sm text-green-800 font-medium">
                                        Page {currentPage} of {totalPages || 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className={`h-8 w-8 flex items-center justify-center rounded-l border border-green-800 ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-800 text-white hover:bg-green-700'
                                                }`}
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span className="h-8 min-w-[3rem] px-2 flex items-center justify-center bg-white border-t border-b border-green-800 text-green-800 font-medium">
                                            {currentPage} / {totalPages || 1}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage >= totalPages || totalPages === 0}
                                            className={`h-8 w-8 flex items-center justify-center rounded-r border border-green-800 ${currentPage >= totalPages || totalPages === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-800 text-white hover:bg-green-700'
                                                }`}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            You do not have permission to view collectible income records.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <CollectibleIncomeModal
                isOpen={isCollectibleModalOpen}
                onClose={() => {
                    setIsCollectibleModalOpen(false);
                    setSelectedCollectible(null);
                    setModalMode('add');
                }}
                onSubmit={handleCollectibleSubmit}
                onUpdate={handleCollectibleUpdate}
                userId={user?.userId || user?.id}
                mode={modalMode}
                initialData={selectedCollectible}
            />

            {/* Close dropdown when clicking outside */}
            {activeMenu && (
                <div className="fixed inset-0 h-full w-full z-0" onClick={() => setActiveMenu(null)} />
            )}
        </div>
    );
};

export default CollectibleIncome;
