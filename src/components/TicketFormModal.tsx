import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, FormEvent, ChangeEvent, useCallback } from 'react';
import {
    IconX, IconTicket, IconFileDescription, IconHierarchy, IconUserCheck,
    IconBuildingStore, IconNote, IconAlertCircle, IconCategory,
    IconUsersGroup, IconPhoto, IconUpload, IconTrash, IconMessageCircle, IconMessages,
    IconLoader
} from '@tabler/icons-react';
import {
    TicketAdminDetails, TicketPriority, TicketStatus, TicketCategory,
    TicketCommentAdminView, TicketImage, UpdateTicketDetailsAdminParams, AdminRole
} from '../lib/types';
import api from '../lib/supabaseClient';
import { useNotification } from './NotificationProvider';
import LoadingSpinner from './LoadingSpinner';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses } from '../lib/twUtils';
import * as displayUtils from '../lib/displayUtils';
import SearchableSelect from './SearchableSelect';
import { formatTimestamp } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

// --- Options ---
const priorityOptions = Object.entries(displayUtils.ticketPriorityMap)
    .map(([value, label]) => ({ value: value as TicketPriority, label }));
const statusOptions = Object.entries(displayUtils.ticketStatusMap)
    .map(([value, label]) => ({ value: value as TicketStatus, label }));
const categoryOptions = Object.entries(displayUtils.ticketCategoryMap)
    .map(([value, label]) => ({ value: value as TicketCategory, label }));

// --- Props ---
interface TicketFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: TicketAdminDetails | null;
    onSuccess: () => void;
}

interface TicketFormBodyProps {
    ticket: TicketAdminDetails;
    onClose: () => void;
    onSuccess: () => void;
}

function TicketFormBody({ ticket, onClose, onSuccess }: TicketFormBodyProps) {
    const { user: authUser, roles: authUserRoles } = useAuth();
    const { showSuccessNotification, showErrorNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [subject, setSubject] = useState(ticket.subject);
    const [description, setDescription] = useState<string | undefined>(ticket.description ?? undefined);
    const [category, setCategory] = useState<TicketCategory | ''>(ticket.category || '');
    const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
    const [status, setStatus] = useState<TicketStatus>(ticket.status);
    const [resolutionNotes, setResolutionNotes] = useState<string | undefined>(ticket.resolution_notes ?? undefined);

    const [assignedSupportAdminId, setAssignedSupportAdminId] = useState<string | undefined>(ticket.assigned_support_admin_id ?? undefined);
    const [assignedVendorId, setAssignedVendorId] = useState<string | undefined>(ticket.assigned_to_vendor_id ?? undefined);
    const [initialAssignedSupportAdminId] = useState<string | undefined>(ticket.assigned_support_admin_id ?? undefined);
    const [initialAssignedVendorId] = useState<string | undefined>(ticket.assigned_to_vendor_id ?? undefined);
    const [initialSupportAdminName] = useState<string | undefined>(ticket.assigned_support_admin_name ?? undefined);
    const [initialVendorName] = useState<string | undefined>(ticket.assigned_vendor_name ?? undefined);

    const [comments, setComments] = useState<TicketCommentAdminView[]>(ticket.comments || []);
    const [images, setImages] = useState<TicketImage[]>(ticket.images || []);
    const [newComment, setNewComment] = useState('');
    const [isInternalComment, setIsInternalComment] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
    const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

    const fetchLatestDetails = useCallback(async () => {
        try {
            const { data: updatedDetailsResult } = await api.getTicketDetailsAdmin(ticket.ticket_id);
            if (updatedDetailsResult) {
                setComments(updatedDetailsResult.comments || []);
                setImages(updatedDetailsResult.images || []);
            }
        } catch (err) {
            showErrorNotification("Refresh Error", "Could not refresh ticket details.");
        }
    }, [ticket.ticket_id, showErrorNotification]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setCommentLoading(true);
        try {
            await api.addTicketCommentAdmin({ p_ticket_id: ticket.ticket_id, p_comment_text: newComment, p_is_internal: isInternalComment });
            showSuccessNotification("Comment Added", "Comment successfully added.");
            setNewComment('');
            setIsInternalComment(false);
            await fetchLatestDetails();
        } catch (err) {
            showErrorNotification("Comment Error", err instanceof Error ? err.message : 'Failed to add comment.');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (deletingCommentId) return;
        if (window.confirm("Delete this comment?")) {
            setDeletingCommentId(commentId);
            try {
                await api.deleteTicketCommentAdmin(commentId);
                showSuccessNotification("Comment Deleted", "Comment deleted.");
                setComments(prev => prev.filter(c => c.comment_id !== commentId));
            } catch (err) {
                showErrorNotification("Deletion Error", err instanceof Error ? err.message : 'Failed to delete comment.');
            } finally {
                setDeletingCommentId(null);
            }
        }
    };

    const handleImageUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0 || imageLoading) return;
        setImageLoading(true);
        const imageFile = files[0];
        try {
            await api.uploadTicketImageAdmin(ticket.ticket_id, imageFile);
            showSuccessNotification("Image Uploaded", `Image uploaded.`);
            await fetchLatestDetails();
        } catch (err: any) {
            showErrorNotification("Upload Error", err.message || 'Failed to upload image.');
        } finally {
            setImageLoading(false);
        }
    }, [ticket.ticket_id, imageLoading, showSuccessNotification, showErrorNotification, fetchLatestDetails]);

    const handleDeleteImage = async (imageId: string) => {
        if (deletingImageId) return;
        if (window.confirm("Delete this image?")) {
            setDeletingImageId(imageId);
            try {
                await api.deleteTicketImageAdmin(imageId);
                showSuccessNotification("Image Deleted", "Image deleted.");
                setImages(prev => prev.filter(img => img.image_id !== imageId));
            } catch (err) {
                showErrorNotification("Deletion Error", err instanceof Error ? err.message : 'Failed to delete image.');
            } finally {
                setDeletingImageId(null);
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const updateDetailsParams: UpdateTicketDetailsAdminParams = {
                p_ticket_id: ticket.ticket_id, p_subject: subject || undefined, p_description: description || undefined,
                p_category: category || undefined, p_priority: priority, p_status: status, p_resolution_notes: resolutionNotes || undefined,
            };
            const { error: detailsUpdateError } = await api.updateTicketDetailsAdmin(updateDetailsParams);
            if (detailsUpdateError) throw detailsUpdateError;

            if (assignedSupportAdminId !== initialAssignedSupportAdminId) {
                if (assignedSupportAdminId) {
                    await api.assignTicketAdmin({ p_ticket_id: ticket.ticket_id, p_target_admin_id: assignedSupportAdminId });
                } else {
                    await api.unassignTicketAdmin(ticket.ticket_id);
                }
            } else if (assignedVendorId !== initialAssignedVendorId) {
                if (assignedVendorId) {
                    await api.assignTicketToVendorAdmin({ p_ticket_id: ticket.ticket_id, p_vendor_id: assignedVendorId });
                } else {
                    await api.unassignTicketAdmin(ticket.ticket_id);
                }
            }

            showSuccessNotification("Ticket Updated", "Ticket updated successfully!");
            onSuccess();
            onClose();
        } catch (submitError: any) {
            const message = submitError?.message || submitError?.details || 'An unexpected error occurred.';
            setError(`Failed to update ticket: ${message}`);
            showErrorNotification("Error updating ticket", message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (id: string, label: string, type: string, value: string | null | undefined, onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, icon: React.ReactNode, placeholder?: string, required = false, rows?: number, readOnly = false) => (
        <div><label htmlFor={id} className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-gray-500">*</span>}</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>{type === 'textarea' ? (<textarea id={id} value={value ?? ''} onChange={onChange} rows={rows || 3} className={`pl-10 ${getBaseInputClasses()} ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder={placeholder} required={required} disabled={loading || readOnly} readOnly={readOnly} />) : (<input type={type} id={id} value={value ?? ''} onChange={onChange} className={`pl-10 ${getBaseInputClasses()} ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder={placeholder} required={required} disabled={loading || readOnly} readOnly={readOnly} />)}</div></div>
    );
    const renderSelect = (id: string, label: string, value: string, onChange: (e: ChangeEvent<HTMLSelectElement>) => void, icon: React.ReactNode, options: { value: string; label: string }[], required = false) => (
        <div><label htmlFor={id} className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-gray-500">*</span>}</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div><select id={id} value={value} onChange={onChange} className={`pl-10 ${getBaseInputClasses()}`} required={required} disabled={loading} >{options.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}</select></div></div>
    );
    const fetchVendorOptions = async (query: string) => { const { data } = await api.listVendorsAdmin({ p_search_term: query, p_limit: 20 }); return (data || []).map(v => ({ value: v.vendor_id, label: v.company_name })); };
    const fetchAdminAssigneeOptions = async (query: string) => {
        const { data, error: adminError } = await api.listAdmins(undefined, true, query, 0, 20);
        if (adminError) { showErrorNotification("Admin Search Error", "Could not load admins."); return []; }
        return (data || []).filter(admin =>
            admin.roles.includes('telecalling-owner-team') ||
            admin.roles.includes('telecalling-tenant-team') ||
            admin.roles.includes('super-admin')
        ).map((admin) => ({ value: admin.user_id, label: `${admin.full_name || admin.email}` }));
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Edit Ticket #{ticket.ticket_id}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200"><IconX className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
                {error && (<div className="p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-700 flex items-center"><IconAlertCircle className="w-4 h-4 mr-2 text-red-500" />{error}</p></div>)}
                <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                    <legend className="text-base font-medium text-gray-900 px-2">Ticket Details</legend>
                    <div className="grid grid-cols-1"><div><label className="block text-sm font-medium text-gray-700">Customer</label><p className='text-sm text-gray-800 mt-1 pl-2'>{ticket.raiser_name || 'N/A'} ({ticket.raiser_email || 'No Email'} | {ticket.raiser_phone || 'No Phone'})</p></div></div>
                    <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">{renderInput("subject", "Subject", "text", subject, (e) => setSubject(e.target.value), <IconTicket className="h-4 w-4" />, "Brief summary...", true)}</div>
                    <div className="grid grid-cols-1">{renderInput("description", "Description", "textarea", description, (e) => setDescription(e.target.value || undefined), <IconFileDescription className="h-4 w-4" />, "Detailed description...", false, 4, ticket.description ? true : false)}</div>
                </fieldset>
                <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                    <legend className="text-base font-medium text-gray-900 px-2">Classification, Status & Assignment</legend>
                    <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6">
                        {renderSelect("category", "Category", category, (e) => setCategory(e.target.value as TicketCategory || ''), <IconCategory className="h-4 w-4" />, categoryOptions, true)}
                        {renderSelect("priority", "Priority", priority, (e) => setPriority(e.target.value as TicketPriority), <IconHierarchy className="h-4 w-4" />, priorityOptions, true)}
                        {renderSelect("status", "Status", status, (e) => setStatus(e.target.value as TicketStatus), <IconUserCheck className="h-4 w-4" />, statusOptions, true)}
                        <SearchableSelect label="Assign to Admin" value={assignedSupportAdminId} onChange={(val) => { setAssignedSupportAdminId(val as string | undefined); if (val) setAssignedVendorId(undefined); }} fetchOptions={fetchAdminAssigneeOptions} placeholder="Search Admins..." icon={<IconUsersGroup size={16} />} initialDisplayValue={initialSupportAdminName} disabled={loading} />
                        <SearchableSelect label="Assign to Vendor" value={assignedVendorId} onChange={(val) => { setAssignedVendorId(val as string | undefined); if (val) setAssignedSupportAdminId(undefined); }} fetchOptions={fetchVendorOptions} placeholder="Search Vendors..." icon={<IconBuildingStore size={16} />} initialDisplayValue={initialVendorName} disabled={loading} />
                    </div>
                </fieldset>
                <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                    <legend className="text-base font-medium text-gray-900 px-2">Resolution</legend>
                    <div className="grid grid-cols-1">{renderInput("resolutionNotes", "Resolution Notes", "textarea", resolutionNotes, (e) => setResolutionNotes(e.target.value || undefined), <IconNote className="h-4 w-4" />, "Details about resolution...", false, 4)}</div>
                </fieldset>
                <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                    <legend className="text-base font-medium text-gray-900 px-2 flex items-center"><IconPhoto className="mr-2 text-gray-500" size={18} /> Ticket Images</legend>
                    {images.length > 0 && (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto pr-2">{images.map((img) => (<div key={img.image_id} className="relative group border rounded-md overflow-hidden"><a href={img.image_url} target="_blank" rel="noopener noreferrer"><img src={img.image_url} alt={`Ticket ${img.image_id.substring(0, 6)}`} className="w-full h-24 object-cover" /></a><button type="button" onClick={() => handleDeleteImage(img.image_id)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100" title="Delete Image" disabled={deletingImageId === img.image_id}>{deletingImageId === img.image_id ? <IconLoader size={14} className="animate-spin" /> : <IconTrash size={14} />}</button>{img.description && <p className='text-xs p-1 bg-gray-100 truncate' title={img.description}>{img.description}</p>}</div>))}</div>)}
                    <div><label htmlFor="ticket-image-upload" className={getSecondaryButtonClasses() + (imageLoading ? ' cursor-not-allowed opacity-50' : '')}>{imageLoading ? <LoadingSpinner size={16} className="mr-2" /> : <IconUpload size={16} className="mr-2" />}Upload Images</label><input id="ticket-image-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} className="hidden" disabled={imageLoading} /></div>
                </fieldset>
                <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                    <legend className="text-base font-medium text-gray-900 px-2 flex items-center"><IconMessages className="mr-2 text-gray-500" size={18} /> Comments</legend>
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                        {comments.length === 0 && <p className="text-sm text-gray-500 italic">No comments yet.</p>}
                        {comments.map((comment) => (
                            <div key={comment.comment_id} className={`p-2 rounded-md border ${comment.is_internal ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs font-semibold text-gray-700">{comment.user_name || 'Unknown'}
                                        {comment.user_is_admin && <span className='ml-1 text-blue-600 text-[10px]'>({(authUserRoles.find(() => authUser?.id === comment.user_id) || 'Admin') as AdminRole})</span>}
                                        {comment.is_internal && <span className="ml-2 text-yellow-700 font-bold">[Internal]</span>}
                                    </p>
                                    <div className='flex items-center space-x-2'><span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span><button type="button" onClick={() => handleDeleteComment(comment.comment_id)} className="text-gray-400 hover:text-red-600 p-0.5 disabled:opacity-50" title="Delete Comment" disabled={deletingCommentId === comment.comment_id}>{deletingCommentId === comment.comment_id ? <IconLoader size={14} className="animate-spin" /> : <IconTrash size={14} />}</button></div>
                                </div>
                                <p className="text-sm text-gray-800 whitespace-pre-line">{comment.comment_text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        {renderInput("newComment", "Add Comment", "textarea", newComment, (e) => setNewComment(e.target.value), <IconMessageCircle className="h-4 w-4" />, "Type comment...", false, 3)}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center"><input id="internal-comment" type="checkbox" checked={isInternalComment} onChange={(e) => setIsInternalComment(e.target.checked)} className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500" /><label htmlFor="internal-comment" className="ml-2 block text-sm text-gray-700">Mark as Internal Note</label></div>
                            <button type="button" onClick={handleAddComment} className={getPrimaryButtonClasses()} disabled={commentLoading || !newComment.trim()}>{commentLoading ? <LoadingSpinner size={16} /> : "Add Comment"}</button>
                        </div>
                    </div>
                </fieldset>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
                <div className="flex items-center space-x-3">
                    <button type="button" onClick={onClose} className={getSecondaryButtonClasses()} disabled={loading}>Cancel</button>
                    <button type="submit" className={getPrimaryButtonClasses()} disabled={loading}>{loading ? (<><LoadingSpinner size={16} className="mr-2" />Saving...</>) : ('Update Ticket')}</button>
                </div>
            </div>
        </form>
    );
}


function TicketFormModal({ isOpen, onClose, ticket, onSuccess }: TicketFormModalProps) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30 backdrop-blur-sm" /></TransitionChild>
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                                {isOpen && ticket && (
                                    <TicketFormBody
                                        key={ticket.ticket_id}
                                        ticket={ticket}
                                        onClose={onClose}
                                        onSuccess={onSuccess}
                                    />
                                )}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default TicketFormModal;