import useSWR from 'swr';
import axios from '@/lib/axios';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const useAuth = ({ middleware, redirectIfAuthenticated }: { middleware?: string, redirectIfAuthenticated?: string } = {}) => {
    const router = useRouter();
    const params = useParams();

    const { data: user, error, mutate } = useSWR('/api/user', () =>
        axios
            .get('/api/user')
            .then(res => res.data)
            .catch(error => {
                if (error.response.status !== 409) throw error;
                router.push('/verify-email');
            }),
    );

    const csrf = () => axios.get('/sanctum/csrf-cookie');

    const register = async ({ setErrors, ...props }: any) => {
        await csrf();
        setErrors([]);

        axios
            .post('/register', props)
            .then(() => mutate())
            .catch(error => {
                if (error.response.status !== 422) throw error;
                setErrors(error.response.data.errors);
            });
    };

    const login = async ({ setErrors, setStatus, ...props }: any) => {
        await csrf();
        setErrors([]);
        setStatus(null);

        axios
            .post('/login', props)
            .then(() => mutate())
            .catch(error => {
                if (error.response.status !== 422) throw error;
                setErrors(error.response.data.errors);
            });
    };

    const logout = async () => {
        if (!error) {
            await axios.post('/logout').then(() => mutate());
        }
        router.push('/login');
    };

    useEffect(() => {
        if (middleware === 'guest' && redirectIfAuthenticated && user) router.push(redirectIfAuthenticated);
        if (window.location.pathname !== '/login' && middleware === 'auth' && error) logout();
    }, [user, error]);

    return {
        user,
        register,
        login,
        logout,
    };
};
