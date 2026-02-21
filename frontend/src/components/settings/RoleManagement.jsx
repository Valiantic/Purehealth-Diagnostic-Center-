import React, { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Archive, X, Save, Users, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { roleAPI } from '../../services/api';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/auth/useAuth';
import usePermissions from '../../hooks/auth/usePermissions';

const RoleManagement = () => {
    const { user } = useAuth();
    const { refetchPermissions } = usePermissions();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [formData, setFormData] = useState({
        roleName: '',
        permissionIds: []
    });
    const [archiveConfirmModal, setArchiveConfirmModal] = useState({ open: false, role: null });
    const [archiving, setArchiving] = useState(false);

    // Fetch roles and permissions on mount
    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await roleAPI.getAllRoles();
            if (response.data?.success) {
                setRoles(response.data.roles);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await roleAPI.getAllPermissions();
            if (response.data?.success) {
                setPermissions(response.data.permissions);
                // Expand all categories by default
                const expanded = {};
                Object.keys(response.data.permissions).forEach(cat => {
                    expanded[cat] = true;
                });
                setExpandedCategories(expanded);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                roleName: role.roleName,
                permissionIds: role.permissions?.map(p => p.permissionId) || []
            });
        } else {
            setEditingRole(null);
            setFormData({
                roleName: '',
                permissionIds: []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
        setFormData({
            roleName: '',
            permissionIds: []
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePermissionToggle = (permissionId) => {
        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(permissionId)
                ? prev.permissionIds.filter(id => id !== permissionId)
                : [...prev.permissionIds, permissionId]
        }));
    };

    const handleCategoryToggle = (category) => {
        const categoryPermissions = permissions[category] || [];
        const categoryPermissionIds = categoryPermissions.map(p => p.permissionId);
        const allSelected = categoryPermissionIds.every(id => formData.permissionIds.includes(id));

        if (allSelected) {
            // Remove all permissions in this category
            setFormData(prev => ({
                ...prev,
                permissionIds: prev.permissionIds.filter(id => !categoryPermissionIds.includes(id))
            }));
        } else {
            // Add all permissions in this category
            setFormData(prev => ({
                ...prev,
                permissionIds: [...new Set([...prev.permissionIds, ...categoryPermissionIds])]
            }));
        }
    };

    const toggleCategoryExpand = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.roleName.trim()) {
            toast.error('Role name is required');
            return;
        }

        // Auto-generate displayName from roleName (capitalize first letter of each word)
        const displayName = formData.roleName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        const roleData = {
            ...formData,
            displayName,
            description: ''
        };

        try {
            if (editingRole) {
                // Update existing role
                const response = await roleAPI.updateRole(
                    editingRole.roleId,
                    roleData,
                    user?.userId
                );
                if (response.data?.success) {
                    toast.success('Role updated successfully');
                    fetchRoles();
                    // Refresh current user's permissions in case their role was updated
                    refetchPermissions();
                    handleCloseModal();
                }
            } else {
                // Create new role
                const response = await roleAPI.createRole(roleData, user?.userId);
                if (response.data?.success) {
                    toast.success('Role created successfully');
                    fetchRoles();
                    // Refresh current user's permissions
                    refetchPermissions();
                    handleCloseModal();
                }
            }
        } catch (error) {
            console.error('Error saving role:', error);
            toast.error(error.response?.data?.message || 'Failed to save role');
        }
    };

    const handleArchiveRole = async (role) => {
        if (role.isSystem) {
            toast.error('System roles cannot be archived');
            return;
        }
        setArchiveConfirmModal({ open: true, role });
    };

    const confirmArchiveRole = async () => {
        const role = archiveConfirmModal.role;
        if (!role) return;

        setArchiving(true);
        try {
            const response = await roleAPI.deleteRole(role.roleId, user?.userId);
            if (response.data?.success) {
                toast.success(response.data.message || 'Role archived successfully');
                fetchRoles();
                setArchiveConfirmModal({ open: false, role: null });
            }
        } catch (error) {
            console.error('Error archiving role:', error);
            toast.error(error.response?.data?.message || 'Failed to archive role');
        } finally {
            setArchiving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Loading roles...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Role Management</h2>
                        <p className="text-sm text-gray-500">Manage roles and permissions for users</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Role
                </button>
            </div>

            {/* Roles Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Permissions
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {roles.filter(role => !role.isSystem).map((role) => (
                            <tr key={role.roleId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role.isSystem ? 'bg-blue-100' : 'bg-green-100'
                                            }`}>
                                            {role.isSystem ? (
                                                <Lock className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <Users className="w-4 h-4 text-green-600" />
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">{role.displayName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {role.permissions?.length || 0} permissions
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {role.isSystem ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            System
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Custom
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleOpenModal(role)}
                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                        title="Edit Role"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    {!role.isSystem && (
                                        <button
                                            onClick={() => handleArchiveRole(role)}
                                            className="text-orange-600 hover:text-orange-800"
                                            title="Archive Role"
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {roles.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No roles found. Create your first role to get started.
                    </div>
                )}
            </div>

            {/* Role Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black opacity-50" onClick={handleCloseModal}></div>

                        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {editingRole ? `Edit Role: ${editingRole.displayName}` : 'Create New Role'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                                {/* Role Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role Name
                                    </label>
                                    <input
                                        type="text"
                                        name="roleName"
                                        value={formData.roleName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., marketing, accounting"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        pattern="^[a-z_]+$"
                                        title="Lowercase letters and underscores only"
                                        disabled={editingRole?.isSystem}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Lowercase letters and underscores only</p>
                                </div>

                                {/* Permissions Matrix */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Permissions
                                    </label>
                                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                                        {Object.entries(permissions).map(([category, perms]) => (
                                            <div key={category} className="border-b border-gray-100 last:border-b-0">
                                                {/* Category Header */}
                                                <div
                                                    className="flex items-center justify-between px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                                    onClick={() => toggleCategoryExpand(category)}
                                                >
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={perms.every(p => formData.permissionIds.includes(p.permissionId))}
                                                            onChange={() => handleCategoryToggle(category)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                                        />
                                                        <span className="ml-2 text-sm font-medium text-gray-700">{category}</span>
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            ({perms.filter(p => formData.permissionIds.includes(p.permissionId)).length}/{perms.length})
                                                        </span>
                                                    </div>
                                                    {expandedCategories[category] ? (
                                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>

                                                {/* Category Permissions */}
                                                {expandedCategories[category] && (
                                                    <div className="px-4 py-2 space-y-1">
                                                        {perms.map((perm) => (
                                                            <label
                                                                key={perm.permissionId}
                                                                className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.permissionIds.includes(perm.permissionId)}
                                                                    onChange={() => handlePermissionToggle(perm.permissionId)}
                                                                    className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                                                />
                                                                <span className="ml-2 text-sm text-gray-600">{perm.displayName}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingRole ? 'Update Role' : 'Create Role'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Confirmation Modal */}
            {archiveConfirmModal.open && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black opacity-50" onClick={() => setArchiveConfirmModal({ open: false, role: null })}></div>

                        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <Archive className="w-5 h-5 text-orange-500 mr-2" />
                                    Archive Role
                                </h3>
                                <button
                                    onClick={() => setArchiveConfirmModal({ open: false, role: null })}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-4">
                                <p className="text-gray-600">
                                    Are you sure you want to archive the role <span className="font-semibold text-gray-800">"{archiveConfirmModal.role?.displayName}"</span>?
                                </p>
                                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-sm text-orange-800 font-medium">⚠️ Warning:</p>
                                    <p className="text-sm text-orange-700 mt-1">
                                        All users assigned to this role will also be archived and will no longer be able to access the system.
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setArchiveConfirmModal({ open: false, role: null })}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                    disabled={archiving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmArchiveRole}
                                    disabled={archiving}
                                    className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    <Archive className="w-4 h-4 mr-2" />
                                    {archiving ? 'Archiving...' : 'Archive Role'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
