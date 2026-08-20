import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { IconBuildingEstate, IconDownload, IconHomeHeart, IconRefresh, IconUsers } from '@tabler/icons-react';
import api from '../lib/supabaseClient';
import { CustomerEnquiryAdmin, CustomerEnquiryStatus, CustomerEnquiryType } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../components/NotificationProvider';
import { useRefreshOnNotification } from '../lib/RealtimeNotificationContext';

const statusStyles: Record<CustomerEnquiryStatus, string> = { NEW: 'bg-blue-50 text-blue-700', CONTACTED: 'bg-amber-50 text-amber-700', CLOSED: 'bg-emerald-50 text-emerald-700' };

const escapeSpreadsheetXml = (value: unknown) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildEnquiriesWorkbook = (enquiries: CustomerEnquiryAdmin[]) => {
    const columns: Array<[string, (enquiry: CustomerEnquiryAdmin) => string | number | null]> = [
        ['Enquiry ID', enquiry => enquiry.enquiry_id], ['Enquiry Type', enquiry => enquiry.enquiry_type], ['Status', enquiry => enquiry.status],
        ['Customer Name', enquiry => enquiry.customer_name], ['Phone', enquiry => enquiry.contact_phone], ['Email', enquiry => enquiry.email],
        ['Occupancy Type', enquiry => enquiry.occupancy_type], ['Bedroom Requirement', enquiry => enquiry.bedroom_requirement], ['Budget', enquiry => enquiry.budget],
        ['Preferred Area', enquiry => enquiry.preferred_area], ['Message', enquiry => enquiry.message],
        ['Submitted At', enquiry => new Date(enquiry.created_at).toLocaleString()], ['Last Updated At', enquiry => new Date(enquiry.updated_at).toLocaleString()],
    ];
    const row = (values: Array<string | number | null>) => `<Row>${values.map(value => `<Cell><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${escapeSpreadsheetXml(value)}</Data></Cell>`).join('')}</Row>`;
    return `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Enquiries"><Table>${row(columns.map(([label]) => label))}${enquiries.map(enquiry => row(columns.map(([, getValue]) => getValue(enquiry)))).join('')}</Table></Worksheet></Workbook>`;
};

export default function Enquiries() {
    const [enquiries, setEnquiries] = useState<CustomerEnquiryAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<CustomerEnquiryStatus | ''>('');
    const [type, setType] = useState<CustomerEnquiryType | ''>('');
    const [savingId, setSavingId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const { showErrorNotification, showSuccessNotification } = useNotification();

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await api.listCustomerEnquiriesAdmin({ status: status || undefined, type: type || undefined, limit: 100 });
        setLoading(false);
        if (error) { showErrorNotification('Could not load enquiries', typeof error === 'string' ? error : 'Please try again.'); return; }
        setEnquiries(data || []);
    }, [status, type, showErrorNotification]);

    useEffect(() => { load(); }, [load]);
    useRefreshOnNotification('enquiries', load);

    const updateStatus = async (enquiryId: string, nextStatus: CustomerEnquiryStatus) => {
        setSavingId(enquiryId);
        const { error } = await api.updateCustomerEnquiryStatusAdmin(enquiryId, nextStatus);
        setSavingId(null);
        if (error) { showErrorNotification('Update failed', typeof error === 'string' ? error : 'Please try again.'); return; }
        setEnquiries(current => current.map(e => e.enquiry_id === enquiryId ? { ...e, status: nextStatus } : e));
        showSuccessNotification('Enquiry updated', `Marked as ${nextStatus.toLowerCase()}.`);
    };

    const downloadEnquiries = async () => {
        setExporting(true);
        const allEnquiries: CustomerEnquiryAdmin[] = [];
        let offset = 0;
        try {
            while (true) {
                const { data, error } = await api.listCustomerEnquiriesAdmin({ status: status || undefined, type: type || undefined, offset, limit: 100 });
                if (error) throw new Error(typeof error === 'string' ? error : 'Please try again.');
                const batch = data || [];
                allEnquiries.push(...batch);
                offset += batch.length;
                if (batch.length < 100) break;
            }
            const blob = new Blob([buildEnquiriesWorkbook(allEnquiries)], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `winoli-enquiries-${new Date().toISOString().slice(0, 10)}.xls`;
            link.click();
            URL.revokeObjectURL(url);
            showSuccessNotification('Download started', `${allEnquiries.length} enquiries were exported to Excel.`);
        } catch (error) {
            showErrorNotification('Could not export enquiries', error instanceof Error ? error.message : 'Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return <div className="min-h-screen bg-[#fcfcfd] pb-12">
        <Helmet><title>Customer Enquiries</title></Helmet>
        <div className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
            <div><div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-600 p-2.5 text-white"><IconUsers size={24} /></div><h1 className="text-3xl font-bold tracking-tight text-slate-900">Customer Enquiries</h1></div><p className="mt-2 text-sm text-slate-500">Owner and tenant requests submitted from the homepage.</p></div>
            <div className="flex flex-wrap gap-3"><button onClick={downloadEnquiries} disabled={exporting || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"><IconDownload size={17} />{exporting ? 'Preparing Excel…' : 'Download Excel'}</button><button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><IconRefresh size={17} /> Refresh</button></div>
        </div></div>
        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><select value={type} onChange={e => setType(e.target.value as CustomerEnquiryType | '')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">All enquiry types</option><option value="TENANT">Tenant</option><option value="OWNER">House owner</option><option value="SELLER">Seller</option><option value="BUYER">Buyer</option></select><select value={status} onChange={e => setStatus(e.target.value as CustomerEnquiryStatus | '')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">All statuses</option><option value="NEW">New</option><option value="CONTACTED">Contacted</option><option value="CLOSED">Closed</option></select><span className="self-center text-sm text-slate-500">{enquiries.length} enquiry{enquiries.length === 1 ? '' : 'ies'}</span></div>
            {loading ? <div className="flex justify-center py-20"><LoadingSpinner size={36} /></div> : enquiries.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-500">No enquiries match these filters.</div> : <div className="grid gap-4 lg:grid-cols-2">
                {enquiries.map(enquiry => <article key={enquiry.enquiry_id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="flex justify-between gap-4"><div className="flex items-center gap-3"><div className={`rounded-xl p-2.5 ${enquiry.enquiry_type === 'TENANT' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>{enquiry.enquiry_type === 'TENANT' ? <IconHomeHeart size={22} /> : <IconBuildingEstate size={22} />}</div><div><h2 className="font-bold text-slate-900">{enquiry.customer_name}</h2><p className="text-sm text-slate-500">{enquiry.enquiry_type === 'TENANT' ? 'Tenant requirement' : 'House owner enquiry'}</p></div></div><span className={`h-fit rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[enquiry.status]}`}>{enquiry.status}</span></div>
                    <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2"><p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</span>{enquiry.contact_phone}</p>{enquiry.email && <p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span>{enquiry.email}</p>}{enquiry.enquiry_type === 'TENANT' ? <><p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Requirement</span>{enquiry.occupancy_type} · {enquiry.bedroom_requirement}</p><p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Budget / Area</span>₹{Number(enquiry.budget || 0).toLocaleString()} · {enquiry.preferred_area}</p></> : <p className="sm:col-span-2"><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Message</span>{enquiry.message}</p>}</div>
                    <div className="mt-5 flex items-center justify-between gap-3"><time className="text-xs text-slate-400">{new Date(enquiry.created_at).toLocaleString()}</time><select disabled={savingId === enquiry.enquiry_id} value={enquiry.status} onChange={e => updateStatus(enquiry.enquiry_id, e.target.value as CustomerEnquiryStatus)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"><option value="NEW">New</option><option value="CONTACTED">Contacted</option><option value="CLOSED">Closed</option></select></div>
                </article>)}
            </div>}
        </main>
    </div>;
}
