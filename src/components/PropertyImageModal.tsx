import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, useCallback, ChangeEvent, useEffect } from 'react';
import {
    IconTrash, IconUpload, IconCheck, IconX, IconGripVertical, IconPhoto,
    IconAlertCircle, IconEdit, IconFileDescription, IconEye, IconEyeOff, IconPhotoFilled, IconFileFilled
} from '@tabler/icons-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    UniqueIdentifier
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { PropertyImage as DetailedPropertyImage, UpdatePropertyImageAdminParams as EditPropertyImagePayload } from '../lib/types';
import api from '../lib/supabaseClient';
import { compressAndResizeImage } from '../lib/imageUtils';
import LoadingSpinner from './LoadingSpinner';
import { useNotification } from './NotificationProvider';
import { getPrimaryButtonClasses, getSecondaryButtonClasses, getBaseInputClasses, getTertiaryButtonClasses } from '../lib/twUtils';
import { formatTimestamp } from '../lib/utils';

interface EditableImage extends DetailedPropertyImage {
    id: UniqueIdentifier;
}

interface FileWithPreview extends File {
    preview: string;
}

// Props for ImageItem
interface ImageItemProps {
    image: EditableImage;
    propertyId: string;
    onDelete: (imageId: string) => Promise<void>;
    onUpdate: (imageId: string, params: Partial<Omit<EditPropertyImagePayload, 'p_property_id' | 'p_image_id'>>) => Promise<void>;
    deletingId: string | null;
    updatingId: string | null;
}

// ImageItem Component
const ImageItem: React.FC<ImageItemProps> = ({ image, onDelete, onUpdate, deletingId, updatingId }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
    const [isHovered, setIsHovered] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [currentDescription, setCurrentDescription] = useState(image.description || '');

    const isProcessing = deletingId === image.image_id || updatingId === image.image_id;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isProcessing ? 0.5 : (isDragging ? 0.7 : 1),
        zIndex: isDragging ? 10 : 1,
    };

    const handleDescriptionSave = async () => {
        if (currentDescription !== (image.description || '')) {
            await onUpdate(image.image_id, { p_description: currentDescription || undefined });
        }
        setIsEditingDesc(false);
    };

    const handleToggleInternal = async () => {
        await onUpdate(image.image_id, { p_is_internal_image: !image.is_internal_image });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group rounded-lg overflow-hidden shadow-sm transition-all duration-200 border bg-gray-50 flex flex-col
                ${isEditingDesc ? 'border-yellow-400 ring-1 ring-yellow-400' : (image.is_internal_image ? 'border-blue-200' : 'border-gray-200')}
                ${isDragging ? 'shadow-2xl ring-2 ring-yellow-500' : ''}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Preview */}
            <a href={image.image_url} target="_blank" rel="noopener noreferrer" className="block h-32 overflow-hidden cursor-pointer">
                <img
                    src={image.image_url}
                    alt={image.description || `Image ${image.display_order + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </a>

            {/* Content Area */}
            <div className="p-2 flex-grow flex flex-col justify-between">
                {isEditingDesc ? (
                    <div className="mb-1">
                        <textarea
                            value={currentDescription}
                            onChange={(e) => setCurrentDescription(e.target.value)}
                            rows={2}
                            className={`${getBaseInputClasses()} text-xs p-1`}
                            placeholder="Enter description..."
                            disabled={isProcessing}
                        />
                        <button
                            onClick={handleDescriptionSave}
                            className={`${getPrimaryButtonClasses()} !text-xs !px-2 !py-1 mt-1 w-full`}
                            disabled={isProcessing || updatingId === image.image_id}
                        >
                            {updatingId === image.image_id && isEditingDesc ? <LoadingSpinner size={12} /> : "Save Desc"}
                        </button>
                        <button
                            onClick={() => setIsEditingDesc(false)}
                            className={`${getTertiaryButtonClasses()} !text-xs !px-2 !py-0.5 mt-1 w-full`}
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <p className="text-xs text-gray-600 mb-1 break-words min-h-[2.5em]" title={image.description || "No description"}>
                        {image.description ? (image.description.length > 50 ? image.description.substring(0, 47) + "..." : image.description) : <em className="text-gray-400">No description</em>}
                    </p>
                )}

                <div className="text-[11px] text-gray-500 mt-auto">
                    <p>Order: {image.display_order}</p>
                    {image.uploaded_at && <p>Uploaded: {formatTimestamp(image.uploaded_at, { day: 'numeric', month: 'short', year: '2-digit' })}</p>}
                </div>
            </div>

            {/* Actions Overlay */}
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-1.5 p-1 transition-opacity duration-200 z-[5]
                ${isHovered || isProcessing || isEditingDesc ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

                {!isEditingDesc && (
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing bg-gray-700/80 text-white p-1.5 rounded-full hover:bg-gray-600 disabled:opacity-50" title="Drag to reorder" disabled={isProcessing}>
                        <IconGripVertical size={14} />
                    </button>
                )}

                {!isEditingDesc && (
                    <button onClick={() => setIsEditingDesc(true)} className="bg-gray-700/80 text-white p-1.5 rounded-full hover:bg-yellow-500 disabled:opacity-50" title="Edit Description" disabled={isProcessing}>
                        <IconEdit size={14} />
                    </button>
                )}

                <button onClick={handleToggleInternal} className={`bg-gray-700/80 text-white p-1.5 rounded-full hover:bg-blue-500 disabled:opacity-50`} title={image.is_internal_image ? "Mark as Public" : "Mark as Internal"} disabled={isProcessing}>
                    {updatingId === image.image_id && !isEditingDesc ? <LoadingSpinner size={12} /> : (image.is_internal_image ? <IconEyeOff size={14} /> : <IconEye size={14} />)}
                </button>

                <button onClick={() => onDelete(image.image_id)} className="bg-red-600/80 text-white p-1.5 rounded-full hover:bg-red-500 disabled:opacity-50" title="Delete Image" disabled={isProcessing}>
                    {deletingId === image.image_id ? <LoadingSpinner size={12} /> : <IconTrash size={14} />}
                </button>
            </div>

            {/* Internal/Public Indicator */}
            <div className={`absolute top-1.5 left-1.5 px-1 py-0.5 rounded-sm text-[10px] font-semibold z-[6] pointer-events-none flex items-center gap-1
                ${image.is_internal_image ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}
                title={image.is_internal_image ? 'Internal Document' : 'Public Image'}>
                {image.is_internal_image ? <IconFileFilled size={10} /> : <IconPhotoFilled size={10} />}
                {image.is_internal_image ? 'Internal' : 'Public'}
            </div>
        </div>
    );
};

// --- Main Modal Component ---
interface PropertyImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    initialImages: DetailedPropertyImage[];
    onImagesUpdated: () => void;
}

function PropertyImageModal({ isOpen, onClose, propertyId, initialImages, onImagesUpdated }: PropertyImageModalProps) {
    const prepareEditableImages = useCallback((imgs: DetailedPropertyImage[]): EditableImage[] => {
        return imgs.map(img => ({ ...img, id: img.image_id })).sort((a, b) => a.display_order - b.display_order);
    }, []);

    const [images, setImages] = useState<EditableImage[]>(() => prepareEditableImages(initialImages));

    // Effect to update images state when initialImages prop changes
    useEffect(() => {
        setImages(prepareEditableImages(initialImages));
    }, [initialImages, prepareEditableImages]);

    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [reordering, setReordering] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [dragActiveDropzone, setDragActiveDropzone] = useState(false);

    // Upload form state
    const [filesToUpload, setFilesToUpload] = useState<FileWithPreview[]>([]);
    const [newImageDescription, setNewImageDescription] = useState('');
    const [isInternalUpload, setIsInternalUpload] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(Date.now());

    const { showSuccessNotification, showErrorNotification, showWarningNotification } = useNotification();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        // Cleanup object URLs on unmount or when filesToUpload changes
        return () => {
            filesToUpload.forEach(file => URL.revokeObjectURL(file.preview));
        };
    }, [filesToUpload]);

    const handleSetFilesToUpload = (newFilesArray: File[]) => {
        // Revoke URLs from the current filesToUpload list before updating
        filesToUpload.forEach(file => URL.revokeObjectURL(file.preview));

        const newFilesWithPreview = newFilesArray
            .filter(f => f.type.startsWith('image/'))
            .map(file => Object.assign(file, { preview: URL.createObjectURL(file) }));

        const nonImageFiles = newFilesArray.filter(f => !f.type.startsWith('image/'));
        if (nonImageFiles.length > 0) {
            showWarningNotification("Invalid File Types", `${nonImageFiles.length} file(s) were not images and were ignored.`);
        }

        setFilesToUpload(newFilesWithPreview);
    };

    const handleImageUpload = async () => {
        if (!propertyId || filesToUpload.length === 0) {
            showWarningNotification("No Files", "Please select one or more image files to upload.");
            return;
        }

        setUploading(true);
        setGlobalError(null);
        let successCount = 0;
        const errorMessages: string[] = [];

        for (const file of filesToUpload) {
            try {
                const compressedFile = await compressAndResizeImage(file, { fileType: file.type });

                const { data: uploadResponse, error: uploadError } = await api.uploadPropertyImageAdmin(
                    propertyId,
                    compressedFile,
                    newImageDescription || undefined, // Applies to all files
                    undefined, // Display order will be handled by backend or subsequent reorder
                    false // Default to not internal, then update if needed
                );

                if (uploadError || !uploadResponse || !uploadResponse.image_id) {
                    throw new Error(typeof uploadError === 'string' ? uploadError : (uploadError?.message || `Upload failed for ${file.name}.`));
                }

                if (isInternalUpload) { // Applies to all files
                    const { error: flagUpdateError } = await api.updatePropertyImageAdmin({
                        p_image_id: uploadResponse.image_id,
                        p_is_internal_image: true
                    });
                    if (flagUpdateError) {
                        console.warn(`Uploaded ${file.name}, but failed to mark as internal:`, flagUpdateError);
                        showWarningNotification("Internal Flag Error", `Image ${file.name} uploaded, but failed to mark as internal.`);
                    }
                }
                successCount++;
                // Small delay between uploads, except for the last one
                if (filesToUpload.indexOf(file) < filesToUpload.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (err: any) {
                console.error(`Error uploading ${file.name}:`, err);
                errorMessages.push(`Failed to upload ${file.name}: ${err.message}`);
            }
        }

        setUploading(false);

        if (successCount > 0) {
            showSuccessNotification("Upload Complete", `${successCount} image(s) uploaded successfully.`);
            onImagesUpdated(); // Fetch all images again
        }

        if (errorMessages.length > 0) {
            const combinedErrorMsg = errorMessages.join('\n');
            setGlobalError(combinedErrorMsg); // Display in modal
            showErrorNotification("Upload Errors", `${errorMessages.length} image(s) failed to upload. See modal for details.`);
        }

        // Clear selection and form if any attempt was made
        if (successCount > 0 || errorMessages.length > 0) {
            handleSetFilesToUpload([]);
            setNewImageDescription('');
            setIsInternalUpload(false);
            setFileInputKey(Date.now());
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        if (deletingId) return;
        if (!window.confirm("Are you sure you want to delete this image? This action cannot be undone.")) return;

        setDeletingId(imageId);
        setGlobalError(null);
        try {
            const { error: deleteError } = await api.deletePropertyImageAdmin(imageId);
            if (deleteError) throw new Error(typeof deleteError === 'string' ? deleteError : (deleteError?.message || 'Failed to delete image.'));
            showSuccessNotification("Image Deleted", "Image deleted successfully.");
            onImagesUpdated();
        } catch (err: any) {
            setGlobalError(err.message || "Failed to delete image");
            showErrorNotification("Deletion Error", err.message || "Failed to delete image");
        } finally {
            setDeletingId(null);
        }
    };

    const handleUpdateImageDetails = async (imageId: string, params: Partial<Omit<EditPropertyImagePayload, 'p_property_id' | 'p_image_id'>>) => {
        if (updatingId) return;
        setUpdatingId(imageId);
        setGlobalError(null);
        try {
            const payload: EditPropertyImagePayload = { p_image_id: imageId, ...params };
            const { error: updateError } = await api.updatePropertyImageAdmin(payload);
            if (updateError) throw new Error(typeof updateError === 'string' ? updateError : (updateError?.message || 'Failed to update image details.'));

            let updateMessage = "Image details updated.";
            if (params.p_description !== undefined) updateMessage = "Description updated.";
            if (params.p_is_internal_image !== undefined) updateMessage = `Image visibility changed to ${params.p_is_internal_image ? 'Internal' : 'Public'}.`;

            showSuccessNotification("Update Successful", updateMessage);
            onImagesUpdated();
        } catch (err: any) {
            setGlobalError(err.message || "Failed to update image details");
            showErrorNotification("Update Error", err.message || "Failed to update image details");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over) {
            setImages((currentImages) => {
                const oldIndex = currentImages.findIndex(item => item.id === active.id);
                const newIndex = currentImages.findIndex(item => item.id === over.id);
                if (oldIndex === -1 || newIndex === -1) return currentImages;
                return arrayMove(currentImages, oldIndex, newIndex);
            });
        }
    };

    const handleSaveChanges = async () => {
        if (!propertyId) return;
        setReordering(true);
        setGlobalError(null);

        try {
            const updatePromises = images.map((image, index) =>
                api.updatePropertyImageAdmin({
                    p_image_id: image.image_id,
                    p_display_order: index,
                })
            );

            const results = await Promise.allSettled(updatePromises);
            const failedUpdates = results.filter(r => r.status === 'rejected');

            if (failedUpdates.length > 0) {
                console.error("Some image orders failed to update:", failedUpdates);
                const firstError = (failedUpdates[0] as PromiseRejectedResult).reason;
                throw new Error(firstError?.message || `${failedUpdates.length} image order(s) failed to update.`);
            }

            showSuccessNotification("Order Saved", `Image order saved successfully!`);
            onImagesUpdated();
        } catch (err: any) {
            setGlobalError(err.message || "Failed to save image order");
            showErrorNotification("Reorder Error", err.message || "Failed to save image order");
        } finally {
            setReordering(false);
        }
    };

    const handleDropzoneDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActiveDropzone(true); };
    const handleDropzoneDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget.contains(e.relatedTarget as Node)) return; setDragActiveDropzone(false); };
    const handleDropzoneDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setDragActiveDropzone(false);
        if (uploading || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
        handleSetFilesToUpload(Array.from(e.dataTransfer.files));
    };
    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (uploading || !e.target.files || e.target.files.length === 0) {
            handleSetFilesToUpload([]);
            return;
        }
        handleSetFilesToUpload(Array.from(e.target.files));
    };

    const handleRemoveFileFromUpload = (indexToRemove: number) => {
        setFilesToUpload(prevFiles => {
            const fileToRemove = prevFiles[indexToRemove];
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prevFiles.filter((_, index) => index !== indexToRemove);
        });
    };

    const anyBlockingOperation = reordering || uploading || !!deletingId || !!updatingId;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={anyBlockingOperation ? () => { } : onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl">
                                <div className="absolute top-0 right-0 pt-4 pr-4 z-20">
                                    <button type="button" className="rounded-full bg-white/80 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500" onClick={onClose} disabled={anyBlockingOperation}>
                                        <IconX className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <DialogTitle as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-1">Manage Property Images & Documents</DialogTitle>
                                    <p className="text-sm text-gray-500 mb-4">Upload, reorder, and manage images. Changes might affect property verification status.</p>

                                    {globalError && (<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center"><IconAlertCircle className="w-5 h-5 mr-2 text-red-500" /><span>{globalError}</span></div>)}

                                    {/* Upload Area */}
                                    <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h4 className='text-md font-semibold text-gray-800 mb-3'>Upload New Image(s)/Document(s)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                            <div
                                                key={fileInputKey}
                                                className={`border-2 border-dashed rounded-lg p-4 h-40 text-center transition-colors duration-200 flex items-center justify-center ${dragActiveDropzone ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                                                onDragOver={handleDropzoneDragOver} onDragEnter={handleDropzoneDragOver} onDragLeave={handleDropzoneDragLeave} onDrop={handleDropzoneDrop}>
                                                <div className="flex flex-col items-center justify-center space-y-1">
                                                    <IconPhoto className={`w-10 h-10 mb-1 ${dragActiveDropzone ? 'text-yellow-600' : 'text-gray-400'}`} />
                                                    <p className="text-sm font-medium text-gray-700">{dragActiveDropzone ? 'Drop files here' : (filesToUpload.length > 0 ? `${filesToUpload.length} file(s) selected` : 'Drag & drop or click to select')}</p>
                                                    <label htmlFor="image-upload-input" className={`mt-1 text-sm font-medium text-[#D9A619] hover:text-[#B58D13] cursor-pointer underline underline-offset-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>{filesToUpload.length > 0 ? 'Change files' : 'Select files'}</label>
                                                    <input type="file" id="image-upload-input" onChange={handleFileInputChange} className="hidden" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label htmlFor="newImageDescription" className="text-sm font-medium text-gray-700 mb-1 flex items-center"><IconFileDescription size={16} className="mr-1 text-gray-400" /> Description</label>
                                                    <input type="text" id="newImageDescription" value={newImageDescription} onChange={(e) => setNewImageDescription(e.target.value)} className={getBaseInputClasses()} placeholder="Briefly describe the image(s)..." disabled={uploading} />
                                                </div>
                                                <div className="flex items-center mt-2">
                                                    <input type="checkbox" id="isInternalUpload" checked={isInternalUpload} onChange={(e) => setIsInternalUpload(e.target.checked)} className="h-4 w-4 text-[#D9A619] border-gray-300 rounded focus:ring-[#B58D13]" disabled={uploading} />
                                                    <label htmlFor="isInternalUpload" className="ml-2 text-sm text-gray-700">Mark all as Internal Document (not public)</label>
                                                </div>
                                                <button onClick={handleImageUpload} className={`${getPrimaryButtonClasses()} w-full mt-2`} disabled={uploading || filesToUpload.length === 0}>
                                                    {uploading ? (<><LoadingSpinner size={16} className="mr-2" />Uploading {filesToUpload.length} file(s)...</>) : (<><IconUpload size={16} className="mr-2" />Upload Selected ({filesToUpload.length})</>)}
                                                </button>
                                            </div>
                                        </div>
                                        {/* Preview Area for filesToUpload */}
                                        {filesToUpload.length > 0 && (
                                            <div className="mt-4">
                                                <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({filesToUpload.length}):</h5>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-2 border rounded-md max-h-40 overflow-y-auto bg-gray-100">
                                                    {filesToUpload.map((file, index) => (
                                                        <div key={index} className="relative group border rounded-md p-1 bg-white shadow-sm flex flex-col items-center">
                                                            <img src={file.preview} alt={file.name} className="w-full h-16 object-contain mb-1" />
                                                            <p className="text-xs text-gray-600 truncate w-full text-center" title={file.name}>{file.name}</p>
                                                            <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                                                            <button
                                                                onClick={() => handleRemoveFileFromUpload(index)}
                                                                className="absolute top-0 right-0 m-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity"
                                                                title="Remove file"
                                                                disabled={uploading}
                                                            >
                                                                <IconX size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="font-medium text-gray-800 mb-1 mt-6">Existing Images ({images.length})</h4>
                                    <p className="text-xs text-gray-500 mb-3">Drag images to reorder them, then click "Save Current Order".</p>


                                    {/* Image Grid */}
                                    {images.length > 0 ? (
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            <SortableContext items={images.map(image => image.id)} strategy={rectSortingStrategy}>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 min-h-[150px] bg-gray-50 p-3 rounded-md border">
                                                    {images.map((image) => (
                                                        <ImageItem key={image.id} image={image} propertyId={propertyId} onDelete={handleDeleteImage} onUpdate={handleUpdateImageDetails} deletingId={deletingId} updatingId={updatingId} />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 border rounded-md bg-gray-50">
                                            <IconPhoto size={32} className="mx-auto text-gray-400 mb-2" stroke={1.5} />
                                            <p>No images uploaded yet for this property.</p>
                                            <p className="text-xs mt-1">Use the form above to add new images.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t">
                                    <button type="button" className={`${getPrimaryButtonClasses()} disabled:opacity-60`} onClick={handleSaveChanges} disabled={anyBlockingOperation || images.length === 0}>
                                        {reordering ? (<><LoadingSpinner size={16} className="mr-2" />Saving Order...</>) : (<><IconCheck size={16} className="mr-2" />Save Current Order</>)}
                                    </button>
                                    <button type="button" className={`${getSecondaryButtonClasses()} mt-3 sm:mt-0 sm:mr-3 disabled:opacity-60`} onClick={onClose} disabled={anyBlockingOperation}>Done</button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default PropertyImageModal;