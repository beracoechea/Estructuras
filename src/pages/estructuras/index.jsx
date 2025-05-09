import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Banner.css'; // Asegúrate que la ruta al CSS es correcta
import { EstructuraConsulta } from './ConsultaEstructura'; 
import { EstructuraEdicion } from './EdicionEstructura';   

export const Estructuras = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [activeView, setActiveView] = useState('estructuras'); // Vista principal activa
    const [currentMode, setCurrentMode] = useState('consulta'); // Sub-modo para estructuras
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

    // Cambia el MODO (consulta/edición) SOLO para la vista de estructuras
    const toggleMode = () => {
        if (activeView === 'estructuras') {
            setCurrentMode(prevMode => (prevMode === 'consulta' ? 'edicion' : 'consulta'));
        }
    };

    // Cambia la VISTA principal
    const changeActiveView = (viewName) => {
        setActiveView(viewName);
       
    };


    if (!userInfo) {
        return (
            <div className="loading-container">
                <p>Cargando...</p>
            </div>
        );
    }

    const photoURL = userInfo.userPhoto || 'https://via.placeholder.com/100?text=User';
    // La clase del sidebar ahora depende del MODO (consulta/edición), no de la vista activa
    const sidebarModeClass = currentMode === 'edicion' ? 'sidebar-mode-edicion' : 'sidebar-mode-consulta';
    const buttonModeText = currentMode === 'consulta' ? 'Cambiar a Modo Edición' : 'Cambiar a Modo Consulta';

    // Helper para renderizar el contenido principal
    const renderMainContent = () => {
        switch (activeView) {
            case 'estructuras':
                return currentMode === 'consulta'
                    ? <EstructuraConsulta userInfo={userInfo} />
                    : <EstructuraEdicion userInfo={userInfo} />;
            default:
                // Vista por defecto o fallback si activeView es inválido
                return <EstructuraConsulta userInfo={userInfo} />;
        }
    };

    return (
        <div className="estructuras-page-container">
            {/* El sidebar ahora usa la clase de MODO, no de VISTA */}
            <aside className={`sidebar-user-info ${sidebarModeClass}`}>
                <img src={photoURL} alt={userInfo.userName} className="user-photo" />
                <h1>Bienvenido:</h1>
                <h2>{userInfo.userName}</h2>
                <p className="user-email">{userInfo.userEmail}</p>

                {/* Navegación Principal */}
                <nav className="sidebar-nav">
                    <button
                        className={`nav-button ${activeView === 'estructuras' ? 'active' : ''}`}
                        onClick={() => changeActiveView('estructuras')}
                    >
                        Estructuras
                    </button>
        
                </nav>

                {/* Botón para cambiar Modo Consulta/Edición (solo para Estructuras) */}
                 {/* Se deshabilita si la vista activa no es 'estructuras' */}
                <button
                    className="mode-toggle-button"
                    onClick={toggleMode}
                    disabled={activeView !== 'estructuras'}
                    title={activeView !== 'estructuras' ? "Disponible sólo en la vista de Estructuras" : ""}
                >
                    {buttonModeText}
                </button>

                 {/* Botón de Cerrar Sesión */}
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
                 {/* Indicador opcional de vista/modo actual */}
                 <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <p style={{ fontStyle: 'italic', color: '#555' }}>
                         {/* Mostrar vista activa y modo si aplica */}
                        Vista: <strong>{activeView === 'estados_cuenta' ? 'Estados de Cuenta' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}</strong>
                        {activeView === 'estructuras' && ` / Modo: ${currentMode === 'consulta' ? 'Consulta' : 'Edición'}`}
                     </p>
                 </div>

                {/* Renderizar el componente de contenido adecuado */}
                {renderMainContent()}
            </main>
        </div>
    );
};