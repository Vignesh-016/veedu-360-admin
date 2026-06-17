import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    IconSettings, IconUpload, IconCheck, IconTrash,
    IconLoader, IconPlus, IconStar, IconWorld
} from '@tabler/icons-react';

import LoadingSpinner from '../components/LoadingSpinner';
import api from '../lib/supabaseClient';
import { HomepageSettings, FeatureItem, TestimonialItem } from '../lib/types';
import { useNotification } from '../components/NotificationProvider';
import {
    getPrimaryButtonClasses, getSecondaryButtonClasses, getBaseInputClasses
} from '../lib/twUtils';

const DEFAULT_ICONS = ['IconClipboardCheck', 'IconArmchair', 'IconBuildingCommunity', 'IconHome2', 'IconStar', 'IconSettings'];

function HomepageSettingsPage() {
    const [settings, setSettings] = useState<HomepageSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'hero' | 'promos' | 'whychooseus' | 'testimonials' | 'support'>('hero');

    const { showSuccessNotification, showErrorNotification } = useNotification();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await api.getHomepageSettings();
                if (fetchError) throw fetchError;
                setSettings(data);
            } catch (err: any) {
                console.error("Error fetching homepage settings:", err);
                setError(err.message || 'Failed to load homepage settings');
                showErrorNotification("Error", err.message || "Failed to load homepage settings");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [showErrorNotification]);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const { error: saveError } = await api.updateHomepageSettings(settings);
            if (saveError) throw saveError;
            showSuccessNotification("Saved", "Homepage settings updated successfully.");
        } catch (err: any) {
            console.error("Error saving homepage settings:", err);
            showErrorNotification("Save Failed", err.message || "Failed to save homepage settings.");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, pathKey: string, updateFn: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(pathKey);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${pathKey.replace(/\./g, '_')}_${Date.now()}.${fileExt}`;
            const filePath = `homepage/${fileName}`;

            const { error: uploadError } = await api.supabase.storage
                .from('site-assets')
                .upload(filePath, file, {
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = api.supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error("Failed to get public URL for uploaded asset.");
            }

            updateFn(publicUrlData.publicUrl);
            showSuccessNotification("Uploaded", "Asset uploaded successfully. Save settings to apply changes.");
        } catch (err: any) {
            console.error("File upload failed:", err);
            showErrorNotification("Upload Failed", err.message || "Ensure the 'site-assets' public storage bucket exists in Supabase.");
        } finally {
            setUploadingField(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <LoadingSpinner size={40} />
            </div>
        );
    }

    if (error || !settings) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm">
                        <p className="font-bold">Error Loading Settings</p>
                        <p>{error || "No homepage configuration was found in the database. Please check that seeds are run."}</p>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'hero', label: 'Hero Banner & Featured' },
        { id: 'promos', label: 'Promo Sections' },
        { id: 'whychooseus', label: 'Why Choose Us & Services' },
        { id: 'testimonials', label: 'Testimonials' },
        { id: 'support', label: 'Support & Contacts' }
    ];

    return (
        <>
            <Helmet><title>Homepage Settings | {import.meta.env.VITE_COMPANY_NAME || "Veedu 360"}</title></Helmet>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
                                <IconSettings className="mr-2 text-[#D9A619]" size={32} />
                                Homepage Settings
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">Update headers, titles, promo blocks, reviews, and links dynamically.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            className={`${getPrimaryButtonClasses()} flex items-center gap-2`}
                            disabled={saving || uploadingField !== null}
                        >
                            {saving ? <IconLoader size={16} className="animate-spin" /> : <IconCheck size={16} />}
                            {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 shadow-sm border border-b-0 border-gray-100">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors duration-150
                                        ${activeTab === tab.id
                                            ? 'border-[#D9A619] text-[#D9A619]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                    `}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-b-xl border border-t-0 border-gray-100 shadow-sm p-6 mb-8">
                        
                        {/* TAB 1: HERO & FEATURED */}
                        {activeTab === 'hero' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Hero Section</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title Text</label>
                                        <input
                                            type="text"
                                            value={settings.hero.title}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                hero: { ...settings.hero, title: e.target.value }
                                            })}
                                            className={getBaseInputClasses()}
                                            placeholder="Enter banner header title..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Background Image (URL or Upload)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={settings.hero.bg_image}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    hero: { ...settings.hero, bg_image: e.target.value }
                                                })}
                                                className={`flex-grow ${getBaseInputClasses()}`}
                                                placeholder="Paste background image URL..."
                                            />
                                            <div className="relative">
                                                <label className={`${getSecondaryButtonClasses()} cursor-pointer flex items-center gap-1`}>
                                                    {uploadingField === 'hero.bg_image' ? <IconLoader size={16} className="animate-spin" /> : <IconUpload size={16} />}
                                                    Upload
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, 'hero.bg_image', (url) => setSettings({
                                                            ...settings,
                                                            hero: { ...settings.hero, bg_image: url }
                                                        }))}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        {settings.hero.bg_image && (
                                            <div className="mt-3 relative h-36 max-w-sm rounded-lg overflow-hidden border border-gray-200">
                                                <img src={settings.hero.bg_image} alt="Hero Banner Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 pt-4">Featured Properties Section</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Featured Section Title</label>
                                        <input
                                            type="text"
                                            value={settings.featured_properties.title}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                featured_properties: { ...settings.featured_properties, title: e.target.value }
                                            })}
                                            className={getBaseInputClasses()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Properties Display Limit</label>
                                        <input
                                            type="number"
                                            value={settings.featured_properties.limit}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                featured_properties: { ...settings.featured_properties, limit: parseInt(e.target.value) || 4 }
                                            })}
                                            className={getBaseInputClasses()}
                                            min={1}
                                            max={20}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: PROMOS */}
                        {activeTab === 'promos' && (
                            <div className="space-y-8">
                                {/* Plots & Land Promo */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Plots & Land Promo Block</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Tag</label>
                                            <input
                                                type="text"
                                                value={settings.plots_promo.tag}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    plots_promo: { ...settings.plots_promo, tag: e.target.value }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Title</label>
                                            <input
                                                type="text"
                                                value={settings.plots_promo.title}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    plots_promo: { ...settings.plots_promo, title: e.target.value }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Description</label>
                                            <textarea
                                                value={settings.plots_promo.description}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    plots_promo: { ...settings.plots_promo, description: e.target.value }
                                                })}
                                                rows={2}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                                            <input
                                                type="text"
                                                value={settings.plots_promo.btn_text}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    plots_promo: { ...settings.plots_promo, btn_text: e.target.value }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Button Link Target</label>
                                            <input
                                                type="text"
                                                value={settings.plots_promo.btn_link}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    plots_promo: { ...settings.plots_promo, btn_link: e.target.value }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Feature Image (URL or Upload)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={settings.plots_promo.bg_image}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        plots_promo: { ...settings.plots_promo, bg_image: e.target.value }
                                                    })}
                                                    className={`flex-grow ${getBaseInputClasses()}`}
                                                />
                                                <label className={`${getSecondaryButtonClasses()} cursor-pointer flex items-center gap-1`}>
                                                    {uploadingField === 'plots_promo.bg_image' ? <IconLoader size={16} className="animate-spin" /> : <IconUpload size={16} />}
                                                    Upload
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, 'plots_promo.bg_image', (url) => setSettings({
                                                            ...settings,
                                                            plots_promo: { ...settings.plots_promo, bg_image: url }
                                                        }))}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                            {settings.plots_promo.bg_image && (
                                                <div className="mt-3 relative h-28 max-w-sm rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={settings.plots_promo.bg_image} alt="Plots Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* House/Villa Promo */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">House & Villa Promo Block</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Tag</label>
                                            <input
                                                type="text"
                                                value={settings.houses_promo.tag}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    houses_promo: { ...settings.houses_promo, tag: e.target.value }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Title</label>
                                            <input
                                                type="text"
                                                value={settings.houses_promo.title}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    houses_promo: { ...settings.houses_promo, title: e.target.value }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Description</label>
                                            <textarea
                                                value={settings.houses_promo.description}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    houses_promo: { ...settings.houses_promo, description: e.target.value }
                                                })}
                                                rows={2}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                                            <input
                                                type="text"
                                                value={settings.houses_promo.btn_text}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    houses_promo: { ...settings.houses_promo, btn_text: e.target.value }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Button Link Target</label>
                                            <input
                                                type="text"
                                                value={settings.houses_promo.btn_link}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    houses_promo: { ...settings.houses_promo, btn_link: e.target.value }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Feature Image (URL or Upload)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={settings.houses_promo.bg_image}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        houses_promo: { ...settings.houses_promo, bg_image: e.target.value }
                                                    })}
                                                    className={`flex-grow ${getBaseInputClasses()}`}
                                                />
                                                <label className={`${getSecondaryButtonClasses()} cursor-pointer flex items-center gap-1`}>
                                                    {uploadingField === 'houses_promo.bg_image' ? <IconLoader size={16} className="animate-spin" /> : <IconUpload size={16} />}
                                                    Upload
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, 'houses_promo.bg_image', (url) => setSettings({
                                                            ...settings,
                                                            houses_promo: { ...settings.houses_promo, bg_image: url }
                                                        }))}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                            {settings.houses_promo.bg_image && (
                                                <div className="mt-3 relative h-28 max-w-sm rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={settings.houses_promo.bg_image} alt="Houses Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: WHY CHOOSE US & SERVICES */}
                        {activeTab === 'whychooseus' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Why Choose Us</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                                        <input
                                            type="text"
                                            value={settings.why_choose_us.title}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                why_choose_us: { ...settings.why_choose_us, title: e.target.value }
                                            })}
                                            className={getBaseInputClasses()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Subtitle</label>
                                        <input
                                            type="text"
                                            value={settings.why_choose_us.subtitle}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                why_choose_us: { ...settings.why_choose_us, subtitle: e.target.value }
                                            })}
                                            className={getBaseInputClasses()}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Center Illustration Image (URL or Upload)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={settings.why_choose_us.bg_image}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    why_choose_us: { ...settings.why_choose_us, bg_image: e.target.value }
                                                })}
                                                className={`flex-grow ${getBaseInputClasses()}`}
                                            />
                                            <label className={`${getSecondaryButtonClasses()} cursor-pointer flex items-center gap-1`}>
                                                {uploadingField === 'why_choose_us.bg_image' ? <IconLoader size={16} className="animate-spin" /> : <IconUpload size={16} />}
                                                Upload
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'why_choose_us.bg_image', (url) => setSettings({
                                                        ...settings,
                                                        why_choose_us: { ...settings.why_choose_us, bg_image: url }
                                                    }))}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        {settings.why_choose_us.bg_image && (
                                            <div className="mt-3 relative h-28 max-w-sm rounded-lg overflow-hidden border border-gray-200">
                                                <img src={settings.why_choose_us.bg_image} alt="Why Choose Us Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h4 className="font-bold text-gray-700 mb-2">Feature Cards (4 Required)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {settings.why_choose_us.features.map((feature, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
                                                <span className="text-xs font-bold text-[#D9A619]">Card #{index + 1}</span>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="col-span-2">
                                                        <label className="text-xs font-semibold text-gray-500">Title</label>
                                                        <input
                                                            type="text"
                                                            value={feature.title}
                                                            onChange={(e) => {
                                                                const updatedFeatures = [...settings.why_choose_us.features];
                                                                updatedFeatures[index] = { ...feature, title: e.target.value };
                                                                setSettings({
                                                                    ...settings,
                                                                    why_choose_us: { ...settings.why_choose_us, features: updatedFeatures }
                                                                });
                                                            }}
                                                            className={`${getBaseInputClasses()} !p-1.5 !text-sm`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500">Icon</label>
                                                        <select
                                                            value={feature.icon}
                                                            onChange={(e) => {
                                                                const updatedFeatures = [...settings.why_choose_us.features];
                                                                updatedFeatures[index] = { ...feature, icon: e.target.value };
                                                                setSettings({
                                                                    ...settings,
                                                                    why_choose_us: { ...settings.why_choose_us, features: updatedFeatures }
                                                                });
                                                            }}
                                                            className={`${getBaseInputClasses()} !p-1.5 !text-sm`}
                                                        >
                                                            {DEFAULT_ICONS.map(i => (
                                                                <option key={i} value={i}>{i.replace('Icon', '')}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500">Description</label>
                                                    <textarea
                                                        value={feature.description}
                                                        onChange={(e) => {
                                                            const updatedFeatures = [...settings.why_choose_us.features];
                                                            updatedFeatures[index] = { ...feature, description: e.target.value };
                                                            setSettings({
                                                                    ...settings,
                                                                    why_choose_us: { ...settings.why_choose_us, features: updatedFeatures }
                                                            });
                                                        }}
                                                        rows={2}
                                                        className={`${getBaseInputClasses()} !p-1.5 !text-sm`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 pt-6">Management Services Section</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                                        <input
                                            type="text"
                                            value={settings.management_services.title}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                management_services: { ...settings.management_services, title: e.target.value }
                                            })}
                                            className={getBaseInputClasses()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Subtitle</label>
                                        <input
                                            type="text"
                                            value={settings.management_services.subtitle}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                management_services: { ...settings.management_services, subtitle: e.target.value }
                                            })}
                                            className={getBaseInputClasses()}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: TESTIMONIALS */}
                        {activeTab === 'testimonials' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Customer Testimonials</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Header Title</label>
                                        <input
                                            type="text"
                                            value={settings.testimonials.title}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                testimonials: { ...settings.testimonials, title: e.target.value }
                                            })}
                                            className={getBaseInputClasses()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Header Subtitle</label>
                                        <input
                                            type="text"
                                            value={settings.testimonials.subtitle}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                testimonials: { ...settings.testimonials, subtitle: e.target.value }
                                            })}
                                            className={getBaseInputClasses()}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-700">Reviews list</h4>
                                        <button
                                            onClick={() => {
                                                const newList = [...settings.testimonials.list, {
                                                    name: 'New Reviewer',
                                                    rating: 5,
                                                    avatar: '',
                                                    comment: 'Paste custom customer comment here...'
                                                }];
                                                setSettings({
                                                    ...settings,
                                                    testimonials: { ...settings.testimonials, list: newList }
                                                });
                                            }}
                                            className={`${getSecondaryButtonClasses()} text-xs flex items-center gap-1`}
                                        >
                                            <IconPlus size={14} /> Add Testimonial
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {settings.testimonials.list.map((review, index) => (
                                            <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col md:flex-row gap-4 items-start relative">
                                                <button
                                                    onClick={() => {
                                                        const newList = settings.testimonials.list.filter((_, idx) => idx !== index);
                                                        setSettings({
                                                            ...settings,
                                                            testimonials: { ...settings.testimonials, list: newList }
                                                        });
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full border border-transparent hover:border-red-200 transition-all"
                                                    title="Delete Review"
                                                >
                                                    <IconTrash size={16} />
                                                </button>

                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D9A619] shadow-sm bg-white flex items-center justify-center">
                                                        {review.avatar ? (
                                                            <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <IconWorld className="text-gray-400 w-8 h-8" />
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <label className={`${getSecondaryButtonClasses()} !px-2 !py-1 !text-xs cursor-pointer flex items-center gap-0.5`}>
                                                            {uploadingField === `testimonials.list.${index}.avatar` ? <IconLoader size={12} className="animate-spin" /> : <IconUpload size={12} />}
                                                            Avatar
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleFileUpload(e, `testimonials.list.${index}.avatar`, (url) => {
                                                                    const newList = [...settings.testimonials.list];
                                                                    newList[index] = { ...review, avatar: url };
                                                                    setSettings({
                                                                        ...settings,
                                                                        testimonials: { ...settings.testimonials, list: newList }
                                                                    });
                                                                })}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3 w-full pr-6">
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500">Customer Name</label>
                                                        <input
                                                            type="text"
                                                            value={review.name}
                                                            onChange={(e) => {
                                                                const newList = [...settings.testimonials.list];
                                                                newList[index] = { ...review, name: e.target.value };
                                                                setSettings({
                                                                    ...settings,
                                                                    testimonials: { ...settings.testimonials, list: newList }
                                                                });
                                                            }}
                                                            className={getBaseInputClasses()}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500">Stars (Rating)</label>
                                                        <select
                                                            value={review.rating}
                                                            onChange={(e) => {
                                                                const newList = [...settings.testimonials.list];
                                                                newList[index] = { ...review, rating: parseInt(e.target.value) || 5 };
                                                                setSettings({
                                                                    ...settings,
                                                                    testimonials: { ...settings.testimonials, list: newList }
                                                                });
                                                            }}
                                                            className={getBaseInputClasses()}
                                                        >
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-3">
                                                        <label className="text-xs font-semibold text-gray-500">Reviewer avatar URL</label>
                                                        <input
                                                            type="text"
                                                            value={review.avatar}
                                                            onChange={(e) => {
                                                                const newList = [...settings.testimonials.list];
                                                                newList[index] = { ...review, avatar: e.target.value };
                                                                setSettings({
                                                                    ...settings,
                                                                    testimonials: { ...settings.testimonials, list: newList }
                                                                });
                                                            }}
                                                            className={getBaseInputClasses()}
                                                            placeholder="Or paste custom image URL directly..."
                                                        />
                                                    </div>
                                                    <div className="md:col-span-3">
                                                        <label className="text-xs font-semibold text-gray-500">Comment Text</label>
                                                        <textarea
                                                            value={review.comment}
                                                            onChange={(e) => {
                                                                const newList = [...settings.testimonials.list];
                                                                newList[index] = { ...review, comment: e.target.value };
                                                                setSettings({
                                                                    ...settings,
                                                                    testimonials: { ...settings.testimonials, list: newList }
                                                                });
                                                            }}
                                                            rows={2}
                                                            className={getBaseInputClasses()}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: SUPPORT */}
                        {activeTab === 'support' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Support Contacts & Options</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* WhatsApp */}
                                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                                        <span className="text-xs font-bold text-green-600 uppercase tracking-wide">WhatsApp Support</span>
                                        <div>
                                            <label className="text-xs text-gray-500">Card Header Title</label>
                                            <input
                                                type="text"
                                                value={settings.support.whatsapp.title}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    support: {
                                                        ...settings.support,
                                                        whatsapp: { ...settings.support.whatsapp, title: e.target.value }
                                                    }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Subtext Description</label>
                                            <input
                                                type="text"
                                                value={settings.support.whatsapp.subtitle}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    support: {
                                                        ...settings.support,
                                                        whatsapp: { ...settings.support.whatsapp, subtitle: e.target.value }
                                                    }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">WhatsApp Link API URL</label>
                                            <input
                                                type="text"
                                                value={settings.support.whatsapp.link}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    support: {
                                                        ...settings.support,
                                                        whatsapp: { ...settings.support.whatsapp, link: e.target.value }
                                                    }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                    </div>

                                    {/* Support Call */}
                                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Phone Call Support</span>
                                        <div>
                                            <label className="text-xs text-gray-500">Card Header Title</label>
                                            <input
                                                type="text"
                                                value={settings.support.call.title}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    support: {
                                                        ...settings.support,
                                                        call: { ...settings.support.call, title: e.target.value }
                                                    }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Subtext Description</label>
                                            <input
                                                type="text"
                                                value={settings.support.call.subtitle}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    support: {
                                                        ...settings.support,
                                                        call: { ...settings.support.call, subtitle: e.target.value }
                                                    }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Support Phone Link (e.g. tel:xxx)</label>
                                            <input
                                                type="text"
                                                value={settings.support.call.link}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    support: {
                                                        ...settings.support,
                                                        call: { ...settings.support.call, link: e.target.value }
                                                    }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                    </div>

                                    {/* Support Email */}
                                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Email Support</span>
                                        <div>
                                            <label className="text-xs text-gray-500">Card Header Title</label>
                                            <input
                                                type="text"
                                                value={settings.support.email.title}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    support: {
                                                        ...settings.support,
                                                        email: { ...settings.support.email, title: e.target.value }
                                                    }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Subtext Description</label>
                                            <input
                                                type="text"
                                                value={settings.support.email.subtitle}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    support: {
                                                        ...settings.support,
                                                        email: { ...settings.support.email, subtitle: e.target.value }
                                                    }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Support Email Link (e.g. mailto:xxx)</label>
                                            <input
                                                type="text"
                                                value={settings.support.email.link}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    support: {
                                                        ...settings.support,
                                                        email: { ...settings.support.email, link: e.target.value }
                                                    }
                                                })}
                                                className={getBaseInputClasses()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Action */}
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={handleSave}
                                className={`${getPrimaryButtonClasses()} flex items-center gap-2`}
                                disabled={saving || uploadingField !== null}
                            >
                                {saving ? <IconLoader size={18} className="animate-spin" /> : <IconCheck size={18} />}
                                {saving ? "Saving Changes..." : "Save Settings"}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}

export default HomepageSettingsPage;
