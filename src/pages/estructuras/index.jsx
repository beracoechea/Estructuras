import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Banner.css';
import { EstructuraConsulta } from './ConsultaEstructura'; // Ajusta la ruta si es necesario
import { EstructuraEdicion} from './EdicionEstructura';   // Ajusta la ruta si es necesario

export const Estructuras = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [currentMode, setCurrentMode] = useState('consulta'); // 'consulta' o 'edicion'
    const navigate = useNavigate();

    useEffect(() => {
        const storedAuthInfo = localStorage.getItem("auth");
        if (storedAuthInfo) {
            try {
                const parsedInfo = JSON.parse(storedAuthInfo);
                if (parsedInfo && parsedInfo.isAuth) {
                    setUserInfo(parsedInfo);
                } else {
                    navigate("/");
                }
            } catch (error) {
                console.error("Error al parsear información de autenticación:", error);
                navigate("/");
            }
        } else {
            navigate("/");
        }
    }, [navigate]);

    const toggleMode = () => {
        setCurrentMode(prevMode => (prevMode === 'consulta' ? 'edicion' : 'consulta'));
    };

    if (!userInfo) {
        return (
            <div className="loading-container">
                <p>Cargando...</p>
            </div>
        );
    }

    const photoURL = userInfo.userPhoto || 'https://via.placeholder.com/100?text=User';
    const sidebarModeClass = currentMode === 'edicion' ? 'sidebar-mode-edicion' : 'sidebar-mode-consulta';
    const buttonModeText = currentMode === 'consulta' ? 'Cambiar a Modo Edición' : 'Cambiar a Modo Consulta';

    return (
        <div className="estructuras-page-container">
            <aside className={`sidebar-user-info ${sidebarModeClass}`}>
                <img src={photoURL} alt={userInfo.userName} className="user-photo" />
                <h1>Bienvenido:</h1>
                <h2>{userInfo.userName}</h2>
                <p className="user-email">{userInfo.userEmail}</p>

                <button className="mode-toggle-button" onClick={toggleMode}>
                    {buttonModeText}
                </button>

                <nav className="sidebar-nav">
                    {/* Enlaces de navegación si los tienes */}
                </nav>
                <button
                    className="logout-button"
                    onClick={() => {
                        localStorage.removeItem("auth");
                        navigate("/");
                    }}
                >
                    Cerrar Sesión
                </button>
            </aside>
            <main className="main-content-estructuras">
                {/* Texto informativo del modo actual, puedes mantenerlo o quitarlo */}
                <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <p style={{ fontStyle: 'italic', color: '#555' }}>
                        Actualmente en: <strong>Modo {currentMode === 'consulta' ? 'Consulta' : 'Edición'}</strong>
                    </p>
                </div>

                {/* PASO 3: Renderizado condicional del contenido principal */}
                {currentMode === 'consulta' ? (
                    <EstructuraConsulta userInfo={userInfo} />
                ) : (
                    <EstructuraEdicion userInfo={userInfo} />
                )}
            </main>
        </div>
    );
};