import React, { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const AdminUsers = () => {
    const { userProfile, loading: userLoading } = useUser();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Basic protection: if loaded and not admin, redirect
        if (!userLoading && userProfile && userProfile.effective_role !== 'admin') {
            navigate('/');
        }
    }, [userLoading, userProfile, navigate]);

    useEffect(() => {
        if (!userProfile || userProfile.effective_role !== 'admin') return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();

                const response = await fetch(`${API_URL}/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Falha ao buscar usuários');
                }

                const data = await response.json();
                // Assuming data is an object with a users array
                setUsers(data.users || []);
            } catch (err) {
                console.error(err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [userProfile]);

    if (userLoading) return <div style={{ padding: '2rem' }}>Verificando permissões...</div>;
    if (userProfile?.effective_role !== 'admin') return null; // Should redirect ideally

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ marginBottom: '2rem', color: '#212529' }}>Administração de Usuários</h1>

            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #e9ecef'
            }}>
                {error && <div style={{ color: '#dc3545', marginBottom: '1rem' }}>Erro ao carregar usuários.</div>}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#adb5bd' }}>Carregando lista de usuários...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f3f5', backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '1rem', color: '#495057', fontWeight: 600 }}>Usuário</th>
                                    <th style={{ padding: '1rem', color: '#495057', fontWeight: 600 }}>Tenant</th>
                                    <th style={{ padding: '1rem', color: '#495057', fontWeight: 600 }}>Funções (Roles)</th>
                                    <th style={{ padding: '1rem', color: '#495057', fontWeight: 600 }}>Status / Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f8f9fa' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                                            {u.username}
                                            {u.email && <div style={{ fontSize: '0.8rem', color: '#868e96', fontWeight: 400 }}>{u.email}</div>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                backgroundColor: '#e9ecef',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.9rem'
                                            }}>{u.tenant_id || '-'}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                {(u.roles || []).map((r, i) => (
                                                    <span key={i} style={{
                                                        fontSize: '0.8rem',
                                                        padding: '0.1rem 0.5rem',
                                                        border: '1px solid #dee2e6',
                                                        borderRadius: '12px',
                                                        color: '#495057'
                                                    }}>
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#adb5bd', fontSize: '0.9rem' }}>
                                            {/* Future: Edit/Delete/Audit buttons */}
                                            Visualizar
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#adb5bd' }}>
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
