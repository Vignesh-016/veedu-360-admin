import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import {
    IconBuilding, IconChecks, IconActivity, IconHomeCheck, IconHomeCancel,
    IconMessageCircle, IconTicket, IconUrgent, IconReceipt, IconTruckDelivery
} from '@tabler/icons-react';
import LoadingSpinner from '../LoadingSpinner';
import { DashboardStats, PropertyAdminStatus, PropertyType } from '../../lib/types';
import * as displayUtils from '../../lib/displayUtils';
import { getBaseCardClasses, getSecondaryButtonClasses } from '../../lib/twUtils';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

// --- Chart Colors ---
const COLORS_STATUS = ['#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#e57373', '#FF5733', '#C70039', '#900C3F', '#581845'];
const COLORS_TYPES = ['#8884d8', '#82ca9d', '#ffc658', '#0088FE', '#00C49F', '#FF8042'];
const COLORS_PRIORITY = ['#9E9E9E', '#FFBB28', '#FF8042'];

// --- Helper to format data ---
const formatCategoricalData = (
    data: Record<string, number> | undefined | null,
    labelMap?: Record<string, string>
): { name: string; value: number }[] => {
    if (!data) return [];
    return Object.entries(data)
        .filter(([, value]) => typeof value === 'number' && value > 0)
        .map(([key, value]) => ({
            name: labelMap ? displayUtils.getDisplayValue(labelMap as Record<string, string>, key, key) : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value,
        }));
};

// --- Reusable Chart Card ---
interface ChartCardProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    total?: number | string | null;
    totalLabel?: string;
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    className?: string;
    chartHeight?: number;
}

function ChartCard({
    title, icon, children, total, totalLabel = "Total",
    isLoading, error, onRetry, className = '', chartHeight = 250
}: ChartCardProps) {
    return (
        <div className={`${getBaseCardClasses()} ${className} flex flex-col h-full`}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-base font-semibold text-gray-700 flex items-center">
                    {icon} <span className="ml-2">{title}</span>
                </h3>
                {total !== undefined && total !== null && (
                    <div className="text-right">
                        <p className="text-xs text-gray-500">{totalLabel}</p>
                        <p className="text-lg font-bold text-gray-800">{total}</p>
                    </div>
                )}
            </div>
            <div className="flex-grow p-4 flex items-center justify-center relative" style={{ minHeight: `${chartHeight}px` }}>
                {isLoading ? <LoadingSpinner /> : error ? (
                    <div className="text-center text-red-600">
                        <IconAlertCircle className="mx-auto h-8 w-8 mb-2" />
                        <p className="text-xs">{error}</p>
                        {onRetry && (
                            <button onClick={onRetry} className={`mt-2 ${getSecondaryButtonClasses()} text-xs py-1 px-2`}>
                                <IconRefresh size={14} className='mr-1' /> Retry
                            </button>
                        )}
                    </div>
                ) : children}
            </div>
        </div>
    );
}

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-2 border border-gray-300 rounded shadow-sm text-xs text-black">
                <p className="font-semibold">{label || data.name}</p>
                <p>{`Count: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

interface DashboardChartsProps {
    stats: DashboardStats | null;
    statsLoading: boolean;
    statsError: string | null;
    refetchDashboardStats: () => void;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
    stats, statsLoading, statsError, refetchDashboardStats
}) => {
    // --- Prepare Chart Data (Copied and adapted from Dashboard.tsx) ---
    const propertyTypeData = formatCategoricalData(
        stats?.properties?.properties_by_type,
        displayUtils.propertyTypeMap as Record<PropertyType, string>
    );
    const propertyAdminStatusData = formatCategoricalData(
        stats?.properties?.properties_by_admin_status,
        displayUtils.propertyAdminStatusMap as Record<PropertyAdminStatus, string>
    );
    const propertyPurposeData = formatCategoricalData(
        stats?.properties ? {
            'For Sale': stats.properties.sale_properties_is_listed ?? 0,
            'For Rent': stats.properties.rental_properties_is_listed ?? 0,
        } : undefined
    );
    const occupiedRentals = stats?.properties?.occupied_rentals ?? 0;
    const totalListedRentals = stats?.properties?.rental_properties_is_listed ?? 0;
    const vacantListedRentals = totalListedRentals - occupiedRentals;
    const occupancyData = formatCategoricalData(
        stats?.properties ? {
            Occupied: occupiedRentals,
            Vacant: vacantListedRentals > 0 ? vacantListedRentals : 0,
        } : undefined
    );
    const interactionData = formatCategoricalData(
        stats?.interactions?.interactions_by_status,
        displayUtils.interactionStatusMap,
    );
    const ticketStatusData = formatCategoricalData(
        stats?.tickets?.tickets_by_status,
        displayUtils.ticketStatusMap
    );
    const ticketPriorityData = formatCategoricalData(
        stats?.tickets?.tickets_by_priority,
        displayUtils.ticketPriorityMap
    );
    const vendorStatusData = formatCategoricalData(
        stats?.vendors?.vendors_by_status,
        displayUtils.vendorStatusMap
    );
    const successfulTransactions = stats?.visit_transactions?.successful_transactions ?? 0;
    const totalTransactions = stats?.visit_transactions?.total_transactions ?? 0;
    const otherTransactions = totalTransactions - successfulTransactions;
    const transactionData = formatCategoricalData(
        stats?.visit_transactions ? {
            Successful: successfulTransactions,
            'Other (Pending/Failed)': otherTransactions > 0 ? otherTransactions : 0,
        } : undefined
    );
    const rentStatusData = formatCategoricalData(
        stats?.rent_records?.rent_records_by_status,
        displayUtils.rentStatusMap
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4 mb-12">
            <ChartCard
                title="Property Types (All)"
                icon={<IconBuilding size={18} className="text-gray-500" />}
                total={stats?.properties?.total_properties}
                totalLabel='Total Properties'
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-3"
                chartHeight={220}
            >
                {propertyTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={propertyTypeData} cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" fill="#8884d8" paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                                {propertyTypeData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS_TYPES[index % COLORS_TYPES.length]} />))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No property data</p>)}
            </ChartCard>

            <ChartCard
                title="Properties by Admin Status"
                icon={<IconChecks size={18} className="text-gray-500" />}
                total={stats?.properties?.total_properties}
                totalLabel='Total Properties'
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-3"
                chartHeight={220}
            >
                {propertyAdminStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={propertyAdminStatusData} cx="50%" cy="50%" outerRadius="80%" fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                                {propertyAdminStatusData.map((_, index) => (<Cell key={`cell-prop-status-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No property status data</p>)}
            </ChartCard>

            <ChartCard
                title="Listed Properties by Purpose"
                icon={<IconActivity size={18} className="text-gray-500" />}
                total={stats?.properties?.publicly_listed_properties}
                totalLabel='Total Publicly Listed'
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-2"
                chartHeight={220}
            >
                {propertyPurposeData.length > 0 && (stats?.properties?.publicly_listed_properties ?? 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={propertyPurposeData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(217, 166, 25, 0.1)' }} />
                            <Bar dataKey="value" name="Count" barSize={40}>
                                {propertyPurposeData.map((_, index) => (<Cell key={`cell-purpose-${index}`} fill={COLORS_TYPES[index % COLORS_TYPES.length]} />))}
                                <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fill: '#4B5563' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No listed property data</p>)}
            </ChartCard>

            <ChartCard
                title="Listed Rental Occupancy"
                icon={occupiedRentals > 0 ? <IconHomeCheck size={18} className="text-gray-500" /> : <IconHomeCancel size={18} className="text-gray-500" />}
                total={totalListedRentals}
                totalLabel='Total Listed Rentals'
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-2"
                chartHeight={220}
            >
                {occupancyData.length > 0 && totalListedRentals > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart >
                            <Pie data={occupancyData} cx="50%" cy="50%" outerRadius="80%" fill="#8884d8" dataKey="value" nameKey="name" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                                {occupancyData.map((entry, index) => (<Cell key={`cell-occupancy-${index}`} fill={entry.name === 'Occupied' ? COLORS_STATUS[0] : COLORS_STATUS[1]} />))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No listed rental data</p>)}
            </ChartCard>

            <ChartCard
                title="Interactions by Status"
                icon={<IconMessageCircle size={18} className="text-gray-500" />}
                total={stats?.interactions?.total_interactions}
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-5"
                chartHeight={250}
            >
                {interactionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={interactionData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                            <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(217, 166, 25, 0.1)' }} />
                            <Bar dataKey="value" name="Count" barSize={20}>
                                {interactionData.map((_, index) => (<Cell key={`cell-interaction-${index}`} fill={COLORS_TYPES[index % COLORS_TYPES.length]} />))}
                                <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fill: '#4B5563' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No interaction data</p>)}
            </ChartCard>

            <ChartCard
                title="Tickets by Status"
                icon={<IconTicket size={18} className="text-gray-500" />}
                total={stats?.tickets?.total_tickets}
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-5"
                chartHeight={250}
            >
                {ticketStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ticketStatusData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={30} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Count" barSize={30} >
                                {ticketStatusData.map((_, index) => (<Cell key={`cell-ticket-status-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />))}
                                <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fill: '#4B5563' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No ticket data</p>)}
            </ChartCard>

            <ChartCard
                title="Ticket Priority"
                icon={<IconUrgent size={18} className="text-gray-500" />}
                total={stats?.tickets?.total_tickets}
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-2"
                chartHeight={180}
            >
                {ticketPriorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ticketPriorityData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(217, 166, 25, 0.1)' }} />
                            <Bar dataKey="value" name="Count" barSize={30}>
                                {ticketPriorityData.map((_, index) => (<Cell key={`cell-priority-${index}`} fill={COLORS_PRIORITY[index % COLORS_PRIORITY.length]} />))}
                                <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fill: '#4B5563' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No ticket priority data</p>)}
            </ChartCard>

            <ChartCard
                title="Transactions (Visit Plans)"
                icon={<IconReceipt size={18} className="text-gray-500" />}
                total={stats?.visit_transactions?.total_transactions}
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-3"
                chartHeight={180}
            >
                {transactionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={transactionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} fill="#ff7300" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} fontSize={10}>
                                {transactionData.map((entry, index) => (
                                    <Cell key={`cell-transaction-${index}`} fill={entry.name === 'Successful' ? COLORS_STATUS[0] : COLORS_STATUS[2]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No transaction data</p>)}
            </ChartCard>

            <ChartCard
                title="Vendors by Status"
                icon={<IconTruckDelivery size={18} className="text-gray-500" />}
                total={stats?.vendors?.total_vendors}
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-2"
                chartHeight={180}
            >
                {vendorStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={vendorStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="40%" outerRadius={65} fill="#00C49F" labelLine={false} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} fontSize={10}>
                                {vendorStatusData.map((_, index) => (<Cell key={`cell-vendor-${index}`} fill={COLORS_TYPES[index % COLORS_TYPES.length]} />))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No vendor data</p>)}
            </ChartCard>

            <ChartCard
                title="Rent Records by Status"
                icon={<IconReceipt color="teal" size={18} className="text-gray-500" />}
                total={stats?.rent_records?.total_rent_records}
                totalLabel='Total Rent Records'
                isLoading={statsLoading}
                error={statsError}
                onRetry={refetchDashboardStats}
                className="lg:col-span-3"
                chartHeight={180}
            >
                {rentStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rentStatusData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(217, 166, 25, 0.1)' }} />
                            <Bar dataKey="value" name="Count" barSize={30}>
                                {rentStatusData.map((_, index) => (<Cell key={`cell-rent-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />))}
                                <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fill: '#4B5563' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (<p className="text-gray-400 italic text-sm">No rent data</p>)}
            </ChartCard>
        </div>
    );
};

export default DashboardCharts;