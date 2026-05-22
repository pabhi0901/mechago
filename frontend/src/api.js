const getBaseUrl = () => {
    if (import.meta.env.PROD) {
        return 'https://mechago.onrender.com';
    }
    return 'http://localhost:5000';
};

export const API_URL = getBaseUrl();
