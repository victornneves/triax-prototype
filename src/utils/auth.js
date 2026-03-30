import { fetchAuthSession } from 'aws-amplify/auth';

export async function getAuthHeaders() {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
        throw new Error('No authentication token available');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}
