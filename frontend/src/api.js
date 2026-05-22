const getBaseUrl = () => {
    if (import.meta.env.PROD) {
        return 'https://mechago.onrender.com/api';
    }
    return 'http://localhost:5000/api';
};

export const API_URL = getBaseUrl();
