import { useState, ChangeEvent, FormEvent } from 'react';
import { IconUpload, IconTrash, IconLoader, IconDownload, IconAlertCircle, IconPlus, IconPaperclip, IconX } from '@tabler/icons-react';
import api, { ApiResponse } from '../lib/supabaseClient';
import { CustomerDocument, PropertyDocument, AdminRole, UploadDocumentResponse } from '../lib/types';
import { useAuth } from '../lib/AuthContext';
import { useNotification } from './NotificationProvider';
import { getBaseInputClasses, getPrimaryButtonClasses, getSecondaryButtonClasses, getDangerButtonClasses } from '../lib/twUtils';
import LoadingSpinner from './LoadingSpinner';
import { formatTimestamp } from '../lib/utils';

interface DocumentManagerProps {
    ownerId: string;
    ownerType: 'customer' | 'property';
    documents: Array<CustomerDocument | PropertyDocument>;
    onUploadSuccess: (newDocument: CustomerDocument | PropertyDocument) => void;
    onDeleteSuccess: (documentId: string) => void;
    allowedRoles: AdminRole[];
    documentTypes: string[];
    title: string;
    icon: React.ReactNode;
}

function DocumentManager({
    ownerId,
    ownerType,
    documents,
    onUploadSuccess,
    onDeleteSuccess,
    allowedRoles,
    documentTypes,
    title,
    icon
}: DocumentManagerProps) {
    const { roles: userRoles, isAdmin, user: adminUser } = useAuth();
    const { showSuccessNotification, showErrorNotification, showWarningNotification } = useNotification();

    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [newDocumentType, setNewDocumentType] = useState<string>('');
    const [customDocumentType, setCustomDocumentType] = useState<string>('');
    const [newDocumentDescription, setNewDocumentDescription] = useState<string>('');
    const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
    const [showUploadForm, setShowUploadForm] = useState(false);

    const canManage = isAdmin && userRoles.some(role => allowedRoles.includes(role));

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileToUpload(e.target.files[0]);
        } else {
            setFileToUpload(null);
        }
    };

    const resetUploadForm = () => {
        setFileToUpload(null);
        setNewDocumentType('');
        setCustomDocumentType('');
        setNewDocumentDescription('');
        setUploadError(null);
        setShowUploadForm(false);
    };

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!fileToUpload || (!newDocumentType && !customDocumentType)) {
            showWarningNotification("Missing Info", "Please select a file and specify document type.");
            return;
        }
        setIsUploading(true);
        setUploadError(null);

        const finalDocumentType = newDocumentType === 'OTHER' ? customDocumentType.trim() : newDocumentType;
        if (!finalDocumentType.trim()) {
            showWarningNotification("Missing Type", "Document type cannot be empty.");
            setIsUploading(false);
            return;
        }

        try {
            let response: ApiResponse<UploadDocumentResponse>;
            if (ownerType === 'customer') {
                response = await api.uploadCustomerDocumentAdmin(ownerId, fileToUpload, finalDocumentType, newDocumentDescription || undefined);
            } else { // property
                response = await api.uploadPropertyDocumentAdmin(ownerId, fileToUpload, finalDocumentType, newDocumentDescription || undefined);
            }

            if (response.error || !response.data || !response.data.document_id) {
                throw new Error("Upload failed.");
            }

            showSuccessNotification("Document Uploaded", `${finalDocumentType} uploaded successfully.`);
            const newDocData = response.data;
            const newDoc = {
                document_id: newDocData.document_id,
                document_url: newDocData.document_url,
                file_name: newDocData.file_name || fileToUpload.name,
                document_type: finalDocumentType, // Use the final determined type
                description: newDocumentDescription || null,
                uploaded_by_name: adminUser?.user_metadata?.full_name || adminUser?.email || 'Admin', // Best guess for current admin
                uploaded_at: new Date().toISOString(),
                // ownerType specific fields are not relevant for this generic display part
            } as CustomerDocument | PropertyDocument;

            onUploadSuccess(newDoc);
            resetUploadForm();
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Document upload failed.";
            setUploadError(errMsg);
            showErrorNotification("Upload Error", errMsg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (documentId: string, documentName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${documentName || 'this document'}"? This action cannot be undone.`)) return;

        setDeletingDocId(documentId);
        try {
            if (ownerType === 'customer') {
                await api.deleteCustomerDocumentAdmin(documentId);
            } else { // property
                await api.deletePropertyDocumentAdmin(documentId);
            }
            showSuccessNotification("Document Deleted", `Document "${documentName || 'ID: ' + documentId.substring(0, 6)}" deleted.`);
            onDeleteSuccess(documentId);
        } catch (err) {
            showErrorNotification("Delete Error", err instanceof Error ? err.message : "Failed to delete document.");
        } finally {
            setDeletingDocId(null);
        }
    };

    return (
        <div className="bg-white shadow border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-800 flex items-center">
                    {icon}
                    <span className='ml-2'>{title} ({documents.length})</span>
                </h3>
                {canManage && (
                    <button
                        onClick={() => setShowUploadForm(!showUploadForm)}
                        className={getSecondaryButtonClasses() + " text-xs px-2.5 py-1"}
                    >
                        {showUploadForm ? <IconX size={14} className="mr-1" /> : <IconPlus size={14} className="mr-1" />}
                        {showUploadForm ? 'Cancel' : 'Upload'}
                    </button>
                )}
            </div>

            {canManage && showUploadForm && (
                <form onSubmit={handleUpload} className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
                    {uploadError && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center">
                            <IconAlertCircle size={14} className="mr-1.5 text-red-500" /> {uploadError}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor={`doc-file-${ownerType}`} className="block text-xs font-medium text-gray-700 mb-0.5">Document File</label>
                            <input type="file" id={`doc-file-${ownerType}`} onChange={handleFileChange} className={`${getBaseInputClasses()} p-1.5 text-xs !h-auto`} required disabled={isUploading} />
                        </div>
                        <div>
                            <label htmlFor={`doc-type-${ownerType}`} className="block text-xs font-medium text-gray-700 mb-0.5">Document Type</label>
                            <select id={`doc-type-${ownerType}`} value={newDocumentType} onChange={(e) => setNewDocumentType(e.target.value)} className={`${getBaseInputClasses()} text-xs`} required={!customDocumentType.trim()} disabled={isUploading}>
                                <option value="">Select type...</option>
                                {documentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                <option value="OTHER">Other (Specify)</option>
                            </select>
                        </div>
                    </div>
                    {newDocumentType === 'OTHER' && (
                        <div>
                            <label htmlFor={`custom-doc-type-${ownerType}`} className="block text-xs font-medium text-gray-700 mb-0.5">Custom Document Type</label>
                            <input type="text" id={`custom-doc-type-${ownerType}`} value={customDocumentType} onChange={(e) => setCustomDocumentType(e.target.value)} className={`${getBaseInputClasses()} text-xs`} placeholder="Specify document type" required disabled={isUploading} />
                        </div>
                    )}
                    <div>
                        <label htmlFor={`doc-desc-${ownerType}`} className="block text-xs font-medium text-gray-700 mb-0.5">Description (Optional)</label>
                        <input type="text" id={`doc-desc-${ownerType}`} value={newDocumentDescription} onChange={(e) => setNewDocumentDescription(e.target.value)} className={`${getBaseInputClasses()} text-xs`} placeholder="Brief description..." disabled={isUploading} />
                    </div>
                    <button type="submit" className={getPrimaryButtonClasses() + " text-xs w-full justify-center"} disabled={isUploading || !fileToUpload || (!newDocumentType && !customDocumentType.trim()) || (newDocumentType === 'OTHER' && !customDocumentType.trim())}>
                        {isUploading ? <LoadingSpinner size={14} /> : <IconUpload size={14} />} <span className='ml-1.5'>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                    </button>
                </form>
            )}

            {documents.length > 0 ? (
                <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {documents.map(doc => (
                        <li key={doc.document_id} className="p-3 hover:bg-gray-50 transition-colors duration-150">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0">
                                    <IconPaperclip size={18} className="text-gray-400 mr-2 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block" title={doc.file_name || doc.document_type}>
                                            {doc.file_name || doc.document_type}
                                        </a>
                                        <p className="text-xs text-gray-500 truncate" title={doc.description || undefined}>{doc.description || doc.document_type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                    <a href={doc.document_url} target="_blank" rel="noopener noreferrer" download={doc.file_name || 'document'} className={`${getSecondaryButtonClasses()} p-1.5 text-xs`} title="Download">
                                        <IconDownload size={14} />
                                    </a>
                                    {canManage && (
                                        <button
                                            onClick={() => handleDelete(doc.document_id, doc.file_name || doc.document_type)}
                                            className={`${getDangerButtonClasses()} p-1.5 text-xs`}
                                            disabled={deletingDocId === doc.document_id}
                                            title="Delete Document"
                                        >
                                            {deletingDocId === doc.document_id ? <IconLoader size={14} className="animate-spin" /> : <IconTrash size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 ml-7">
                                Uploaded: {formatTimestamp(doc.uploaded_at)}
                                {doc.uploaded_by_name && <span className="ml-1">by {doc.uploaded_by_name}</span>}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="p-4 text-sm text-gray-500 italic">{canManage && showUploadForm ? 'Upload a document to get started.' : 'No documents uploaded yet.'}</p>
            )}
        </div>
    );
}

export default DocumentManager;