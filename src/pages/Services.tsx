import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconEdit, IconPlus, IconTrash, IconLoader,
    IconSearch, IconCategory, IconRefresh,
    IconListCheck, IconTools, IconChevronDown,
    IconAdjustmentsHorizontal
} from '@tabler/icons-react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import ServiceFormModal from '../components/ServiceFormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import { ServiceAdminView } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import { getGenericBadgeClasses, getBaseInputClasses } from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';

function ServicesPage() {
    const [services, setServices] = useState<ServiceAdminView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceAdminView | null>(null);
    const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
    const { showSuccessNotification, showErrorNotification } = useNotification();

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');

    // Fetch Services
    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await api.listServicesAdmin();
            if (fetchError) throw fetchError;
            // Sort by name for consistent display
            const sortedServices = (data || []).sort((a, b) => a.service_name.localeCompare(b.service_name));
            setServices(sortedServices);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to fetch services';
            setError(errMsg);
            showErrorNotification("Error Fetching Services", errMsg);
            setServices([]);
        } finally {
            setLoading(false);
        }
    }, [showErrorNotification]);

    // Initial fetch
    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // Derived State: Filtered Services
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (service.description?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = !categoryFilter || service.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [services, searchTerm, categoryFilter]);

    // Derived State: Metrics
    const metrics = useMemo(() => {
        const categories = new Set(services.map(s => s.category).filter(Boolean));
        return {
            total: services.length,
            categories: categories.size,
            activeCategories: categories.size // Simplified for now
        };
    }, [services]);

    // Categories for filter
    const uniqueCategories = useMemo(() => {
        return Array.from(new Set(services.map(s => s.category).filter(Boolean))).sort();
    }, [services]);

    const handleAddService = () => {
        setSelectedService(null);
        setIsModalOpen(true);
    };

    const handleEditService = (service: ServiceAdminView) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    const handleDeleteService = async (serviceId: number, serviceName: string) => {
        if (window.confirm(`Are you sure you want to delete the service "${serviceName}"? This might affect vendors assigned to it.`)) {
            setDeletingServiceId(serviceId);
            try {
                const { error: deleteError } = await api.deleteServiceAdmin(serviceId);
                if (deleteError) throw deleteError;
                showSuccessNotification("Service Deleted", `Service "${serviceName}" deleted successfully.`);
                fetchServices();
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Failed to delete service.';
                setError(errMsg);
                showErrorNotification("Deletion Error", errMsg);
            } finally {
                setDeletingServiceId(null);
            }
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('');
    };

    const companyName = import.meta.env.VITE_COMPANY_NAME || "Veedu360";

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12">
            <Helmet>
                <title>{`Services | ${companyName}`}</title>
            </Helmet>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm animate-pulse" role="alert">
                        <p className="font-bold text-sm uppercase tracking-wider">System Alert</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Services</h1>
                        <p className="mt-1 text-sm text-slate-500 font-normal tracking-wide">Configure and manage available capabilities for your vendor network.</p>
                    </div>
                    <button
                        onClick={handleAddService}
                        className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 hover:scale-[1.02] transform transition-all active:scale-[0.98]"
                    >
                        <IconPlus className="mr-2" size={20} stroke={2} />
                        Add New Service
                    </button>
                </div>

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 mr-4">
                            <IconTools size={26} />
                        </div>
                        <div>
                            <p className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.15em]">Total Services</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{loading ? '...' : metrics.total}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 mr-4">
                            <IconCategory size={26} />
                        </div>
                        <div>
                            <p className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.15em]">System Categories</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{loading ? '...' : metrics.categories}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
                        <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 mr-4">
                            <IconListCheck size={26} />
                        </div>
                        <div>
                            <p className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.15em]">Active Status</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">Active</p>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between transition-all hover:shadow-md">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <IconSearch size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Find a service by name or description..."
                            className={`${getBaseInputClasses()} pl-10 h-11 border-gray-200 focus:border-slate-500 rounded-xl bg-slate-50/50 hover:bg-white transition-all`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        <div className="flex-1 md:flex-none">
                            <select
                                className={`${getBaseInputClasses()} h-11 bg-slate-50/50 border-gray-200 rounded-xl text-sm font-medium text-slate-700 min-w-[200px]`}
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{displayUtils.getDisplayValue(displayUtils.serviceCategoryMap, cat)}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 hover:text-slate-700 transition-all font-semibold"
                            title="Reset all search filters"
                        >
                            <IconRefresh size={18} />
                        </button>
                    </div>
                </div>

                {/* Services Table Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                    <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest">Capability Catalog</h2>
                            <p className="text-sm text-slate-400 mt-1 font-medium italic">
                                {loading ? 'Scanning registry...' : `Reviewing ${filteredServices.length} registered service capabilities.`}
                            </p>
                        </div>

                        <Menu as="div" className="relative inline-block text-left w-full sm:w-auto">
                            <MenuButton className="inline-flex items-center justify-between w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 uppercase tracking-widest hover:bg-white transition-all shadow-sm">
                                <span className="flex items-center">
                                    <IconAdjustmentsHorizontal size={14} className="mr-2 opacity-60" />
                                    {categoryFilter ? (displayUtils.getDisplayValue(displayUtils.serviceCategoryMap, categoryFilter)) : 'Quick Select'}
                                </span>
                                <IconChevronDown size={14} className="ml-1 opacity-40" />
                            </MenuButton>
                            <Transition
                                as={Fragment} enter="transition duration-100 ease-out" enterFrom="transform scale-95 opacity-0" enterTo="transform scale-100 opacity-100"
                                leave="transition duration-75 ease-in" leaveFrom="transform scale-100 opacity-100" leaveTo="transform scale-95 opacity-0"
                            >
                                <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-50 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-gray-100">
                                    <div className="px-1 py-1">
                                        {uniqueCategories.map((cat) => (
                                            <MenuItem key={cat}>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => setCategoryFilter(cat)}
                                                        className={`${active ? 'bg-slate-50 text-slate-900 border-l-4 border-slate-900' : 'text-slate-600 border-l-4 border-transparent'} group flex w-full items-center px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all`}
                                                    >
                                                        {displayUtils.getDisplayValue(displayUtils.serviceCategoryMap, cat)}
                                                    </button>
                                                )}
                                            </MenuItem>
                                        ))}
                                        <MenuItem>
                                            {({ active }) => (
                                                <button onClick={handleClearFilters} className={`${active ? 'bg-slate-50 text-slate-900' : 'text-slate-400'} group flex w-full items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-t border-gray-50 mt-1`}>
                                                    Clear All Selections
                                                </button>
                                            )}
                                        </MenuItem>
                                    </div>
                                </MenuItems>
                            </Transition>
                        </Menu>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-24 flex flex-col justify-center items-center">
                                <LoadingSpinner size={48} />
                                <p className="mt-4 text-[11px] font-semibold text-slate-400 animate-pulse tracking-[0.2em] uppercase">Loading Capability Catalog...</p>
                            </div>
                        ) : filteredServices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                                <div className="bg-slate-50 p-6 rounded-full mb-6">
                                    <IconTools size={56} className="text-slate-200" />
                                </div>
                                <p className="text-slate-700 text-xl font-bold uppercase tracking-tight">Catalog is Empty</p>
                                <p className="text-slate-400 mt-2 max-w-xs mx-auto text-sm font-medium">No results matched your current search parameters. Try resetting filters or register a new service capability.</p>
                                <div className="flex gap-4 mt-8">
                                    <button onClick={handleClearFilters} className="inline-flex items-center px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-xl uppercase tracking-widest transition-all hover:bg-slate-50 shadow-sm">
                                        <IconRefresh size={16} className="mr-2" /> Reset View
                                    </button>
                                    <button onClick={handleAddService} className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-100">
                                        <IconPlus size={16} className="mr-2" /> Register Capability
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th scope="col" className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Service Identity</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Classification</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Summary Description</th>
                                        <th scope="col" className="px-6 py-4 text-right text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em]">Action Suite</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {filteredServices.map((service) => (
                                        <tr key={service.service_id} className="hover:bg-slate-50/30 transition-all group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{service.service_name}</span>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5 tracking-widest uppercase">ID: SERV-{service.service_id.toString().padStart(4, '0')}</p>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {service.category ? (
                                                    <span className={`${getGenericBadgeClasses()} inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-50 border border-slate-100 text-slate-600 shadow-sm uppercase tracking-widest`}>
                                                        {displayUtils.getDisplayValue(displayUtils.serviceCategoryMap, service.category)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-slate-300 italic uppercase">Unclassified</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 max-w-md">
                                                <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed" title={service.description ?? ''}>
                                                    {service.description || <span className="text-slate-300 text-[10px] font-bold tracking-widest uppercase">No summary documented</span>}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                                                    <button
                                                        onClick={() => handleEditService(service)}
                                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                                        title="Refine Configuration"
                                                    >
                                                        <IconEdit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteService(service.service_id, service.service_name)}
                                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                        title="Revoke Capability"
                                                        disabled={deletingServiceId === service.service_id}
                                                    >
                                                        {deletingServiceId === service.service_id ? <IconLoader size={18} className="animate-spin text-rose-500" /> : <IconTrash size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <ServiceFormModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                service={selectedService}
                onSuccess={fetchServices}
            />
        </div>
    );
}

export default ServicesPage;