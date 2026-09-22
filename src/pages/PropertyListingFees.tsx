import { useEffect, useState } from 'react';
import api from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../components/NotificationProvider';

type Fee = { listing_type: 'RENTAL' | 'SALE'; fee: number; is_active: boolean };

export default function PropertyListingFees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { showSuccessNotification, showErrorNotification } = useNotification();

  const load = async () => {
    setLoading(true);
    const { data, error } = await (api as any).supabase.from('property_listing_fees')
      .select('listing_type, fee, is_active').order('listing_type');
    if (error) showErrorNotification('Load failed', error.message);
    else setFees(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (item: Fee) => {
    setSaving(item.listing_type);
    const { error } = await (api as any).supabase.from('property_listing_fees')
      .update({ fee: Math.max(0, Number(item.fee)), is_active: item.is_active, updated_at: new Date().toISOString() })
      .eq('listing_type', item.listing_type);
    setSaving(null);
    if (error) showErrorNotification('Save failed', error.message);
    else { showSuccessNotification('Saved', `${item.listing_type} posting fee updated.`); load(); }
  };

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;
  return <div className="p-6 max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold text-slate-900">Property Listing Fees</h1>
    <p className="mt-1 mb-6 text-sm text-slate-500">Separate posting fees. These do not provide property visits or visit credits.</p>
    <div className="rounded-xl bg-white shadow divide-y">
      {fees.map((item, index) => <div key={item.listing_type} className="p-5 flex items-center gap-6">
        <div className="flex-1"><h2 className="font-semibold">{item.listing_type === 'RENTAL' ? 'Rental Property' : 'Sale Property'}</h2><p className="text-sm text-slate-500">Property posting fee only</p></div>
        <input className="w-32 rounded border px-3 py-2" type="number" min="0" value={item.fee} onChange={e => setFees(prev => prev.map((x, i) => i === index ? { ...x, fee: Number(e.target.value) } : x))} />
        <button className="rounded bg-amber-500 px-4 py-2 text-white disabled:opacity-50" disabled={saving === item.listing_type} onClick={() => save(item)}>{saving === item.listing_type ? 'Saving…' : 'Save'}</button>
      </div>)}
    </div>
  </div>;
}
