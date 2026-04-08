import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../utils/auth';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import './AdminUsers.css';

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
                const headers = await getAuthHeaders();

                const response = await fetch(`${API_URL}/users`, {
                    headers: headers
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

    if (userLoading) return <div className="admin-page__permissions-loading">Verificando permissões...</div>;
    if (userProfile?.effective_role !== 'admin') return null; // Should redirect ideally

    return (
        <div className="admin-page">
            <h1 className="admin-page__title">Administração de Usuários</h1>

            <div className="admin-page__card">
                {error && <div className="admin-page__error">Erro ao carregar usuários.</div>}

                {loading ? (
                    <div className="admin-page__loading">Carregando lista de usuários...</div>
                ) : (
                    <div className="admin-page__table-wrap">
                        <table className="admin-page__table">
                            <caption>Usuarios cadastrados na plataforma</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Usuário</th>
                                    <th scope="col">Tenant</th>
                                    <th scope="col">Funções (Roles)</th>
                                    <th scope="col">Status / Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <span className="admin-page__username">{u.username}</span>
                                            {u.email && <div className="admin-page__email">{u.email}</div>}
                                        </td>
                                        <td>
                                            <span className="admin-page__tenant-badge">{u.tenant_id || '-'}</span>
                                        </td>
                                        <td>
                                            <div className="admin-page__roles">
                                                {(u.roles || []).map((r, i) => (
                                                    <span key={i} className="admin-page__role-tag">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="admin-page__action-cell">
                                            {/* Future: Edit/Delete/Audit buttons */}
                                            Visualizar
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className="admin-page__empty">
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
