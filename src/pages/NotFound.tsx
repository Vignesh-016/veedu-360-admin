import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { IconHome } from '@tabler/icons-react';

function NotFound() {
    const companyName = import.meta.env.VITE_COMPANY_NAME;
    return (
        <>
            <Helmet>
                <title>{`404 Not Found | ${companyName}`}</title>
            </Helmet>
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white shadow-lg rounded-lg px-8 py-12 md:px-16 md:py-20 text-center">
                    <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
                    <p className="text-gray-700 text-lg mb-6">
                        Oops! The page you are looking for could not be found.
                    </p>
                    <Link to="/" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">

                        <IconHome className="h-5 w-5 mr-2" aria-hidden="true" />
                        <span>Go to Dashboard</span>
                    </Link>
                </div>
            </div>
        </>
    );
}

export default NotFound;