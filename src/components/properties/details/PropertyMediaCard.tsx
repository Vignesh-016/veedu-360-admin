import { IconPhoto, IconVideo } from '@tabler/icons-react';
import { getBaseCardClasses } from '../../../lib/twUtils';
import { ReportPropertyImageDetail } from '../../../lib/reports/propertyType';

const getVideoIdFromUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
};

interface PropertyMediaCardProps {
    images: ReportPropertyImageDetail[];
    youtubeUrl: string | null | undefined;
}

const PropertyMediaCard: React.FC<PropertyMediaCardProps> = ({ images, youtubeUrl }) => {
    const publicImages = images.filter(img => !img.is_internal_image);
    const videoId = getVideoIdFromUrl(youtubeUrl);

    if (publicImages.length === 0 && !videoId) return null;

    return (
        <>
            {publicImages.length > 0 && (
                <div className={`${getBaseCardClasses()} p-4`}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-semibold text-gray-800 flex items-center">
                            <IconPhoto size={18} className="text-blue-500 mr-2" />
                            Public Images ({publicImages.length})
                        </h3>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                        {publicImages.map((img) => (
                            <a key={img.image_id} href={img.image_url} target="_blank" rel="noopener noreferrer" className="block border rounded overflow-hidden hover:opacity-80 transition-opacity relative group">
                                <img src={img.image_url} alt={img.description || `Image ${img.display_order}`} className="w-full h-20 object-cover" loading="lazy" />
                                {img.description && (<div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200" title={img.description}>{img.description}</div>)}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {videoId && (
                <div className={getBaseCardClasses()}>
                    <div className="p-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-800 flex items-center"><IconVideo size={18} className='mr-2 text-red-500' /> Property Video</h2></div>
                    <div className="aspect-w-16 aspect-h-9 p-5 h-128">
                        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}?mute=1`} title="Property Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                </div>
            )}
        </>
    );
};

export default PropertyMediaCard;