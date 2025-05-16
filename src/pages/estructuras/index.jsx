import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Banner.css'; // Asegúrate que la ruta al CSS es correcta
import { EstructuraConsulta } from './ConsultaEstructura';
import { EstructuraEdicion } from './EdicionEstructura';
import { PrestamosView } from '../prestamos/index';
import { VencimientosView } from '../vencimientos'; // Asegúrate de importar tu componente real

// Importaciones de Firebase para la función de chequeo de vencimientos pendientes
import { firestore } from '../../config/firebase-config'; // Ajusta la ruta
import { collection, getDocs, Timestamp } from 'firebase/firestore'; // Timestamp ya estaba en tu archivo de EstructuraDetalle

// Cuando desarrolles DashboardGeneralView, lo importarás así:
import { DashboardGeneralView } from '../estructuras/graficos/DashboardGeneralView';

const ESTRUCTURA_EXPEDIENTES_COLLECTION = "EstructuraExpedientes"; // Usado en checkForPendingVencimientos

// Función checkForPendingVencimientos (se mantiene como la tenías)
const checkForPendingVencimientos = async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const LIMITE_DIAS_PROXIMOS = 30;
    try {
        const estructuraExpedientesCollectionRef = collection(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION);
        const estructuraExpedientesSnap = await getDocs(estructuraExpedientesCollectionRef);
        if (estructuraExpedientesSnap.empty) return false;
        for (const docSnap of estructuraExpedientesSnap.docs) {
            const dataEstructuraExpedientes = docSnap.data();
            const lista = dataEstructuraExpedientes.listaExpedientes || [];
            for (const exp of lista) {
                if (exp.fechaVencimiento && exp.fechaVencimiento.toDate) {
                    const fechaVenc = exp.fechaVencimiento.toDate();
                    fechaVenc.setHours(0, 0, 0, 0);
                    const diffTime = fechaVenc.getTime() - hoy.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= LIMITE_DIAS_PROXIMOS) return true;
                }
            }
        }
        return false;
    } catch (err) {
        console.error("Error al chequear vencimientos pendientes:", err);
        return false;
    }
};

// --- Marcador de posición para DashboardGeneralView ---
// Deberás crear este componente en su propio archivo, ej: src/pages/dashboard/DashboardGeneralView.jsx
const DashboardGeneralViewPlaceholder = ({ userInfo }) => {
    // Este componente obtendrá y procesará datos de TODOS los expedientes mensuales
    // de TODAS las estructuras para los 6 tipos específicos.
    return (
        <DashboardGeneralView/>
    );
};
// --- Fin del marcador de posición ---

export const Estructuras = () => {
    const [userInfo, setUserInfo] = useState(null);
    // Añadir 'dashboard_general' a las vistas posibles
    const [activeView, setActiveView] = useState('estructuras');
    const [currentMode, setCurrentMode] = useState('consulta');
    const navigate = useNavigate();
    const [hasVencimientosPendientes, setHasVencimientosPendientes] = useState(false);
    const [loadingVencimientoCheck, setLoadingVencimientoCheck] = useState(true);

    const memoizedCheckForPendingVencimientos = useCallback(checkForPendingVencimientos, []);

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

    useEffect(() => {
        if (userInfo) {
            setLoadingVencimientoCheck(true);
            memoizedCheckForPendingVencimientos().then(hasPendientes => {
                setHasVencimientosPendientes(hasPendientes);
                setLoadingVencimientoCheck(false);
            }).catch(() => {
                setHasVencimientosPendientes(false);
                setLoadingVencimientoCheck(false);
            });
        }
    }, [userInfo, memoizedCheckForPendingVencimientos]);

    const toggleMode = () => {
        if (activeView === 'estructuras') {
            setCurrentMode(prevMode => (prevMode === 'consulta' ? 'edicion' : 'consulta'));
        }
    };

    const changeActiveView = (viewName) => {
        setActiveView(viewName);
        // Si se cambia a una vista que no es 'estructuras' y estaba en modo edición, volver a consulta
        if (viewName !== 'estructuras' && currentMode === 'edicion') {
            setCurrentMode('consulta');
        }
    };

    if (!userInfo) {
        return (
            <div className="loading-container">
                <p>Cargando...</p>
            </div>
        );
    }

    const photoURL = userInfo.userPhoto || 'https://via.placeholder.com/100?text=User';
    const sidebarModeClass = activeView === 'estructuras' && currentMode === 'edicion' ?
        'sidebar-mode-edicion' : 'sidebar-mode-consulta';
    const buttonModeText = currentMode === 'consulta' ? 'Cambiar a Modo Edición' : 'Cambiar a Modo Consulta';

    const renderMainContent = () => {
        switch (activeView) {
            case 'estructuras':
                return currentMode === 'consulta'
                    ? <EstructuraConsulta userInfo={userInfo} />
                    : <EstructuraEdicion userInfo={userInfo} />;
            case 'prestamos':
                return <PrestamosView userInfo={userInfo} />;
            case 'vencimientos':
                return <VencimientosView userInfo={userInfo} />;
            case 'dashboard_general': // <-- NUEVO CASO PARA EL DASHBOARD GENERAL
                return <DashboardGeneralViewPlaceholder userInfo={userInfo} />;
            default:
                setActiveView('estructuras'); // Fallback a una vista conocida
                setCurrentMode('consulta');
                return <EstructuraConsulta userInfo={userInfo} />;
        }
    };

    return (
        <div className="estructuras-page-container">
            <aside className={`sidebar-user-info ${sidebarModeClass}`}>
                <img src={photoURL} alt={userInfo.userName} className="user-photo" />
                <h1>Bienvenido:</h1>
                <h2>{userInfo.userName}</h2>
                <p className="user-email">{userInfo.userEmail}</p>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-button ${activeView === 'estructuras' ? 'active' : ''}`}
                        onClick={() => changeActiveView('estructuras')}
                    >
                        Estructuras
                    </button>
                    {/* NUEVO BOTÓN PARA DASHBOARD GENERAL */}
                    <button
                        className={`nav-button ${activeView === 'dashboard_general' ? 'active' : ''}`}
                        onClick={() => changeActiveView('dashboard_general')}
                    >
                        Dashboard General
                    </button>
                    <button
                        className={`nav-button ${activeView === 'prestamos' ? 'active' : ''}`}
                        onClick={() => changeActiveView('prestamos')}
                    >
                        Expedientes en Préstamo
                    </button>
                    <button
                        className={`nav-button ${activeView === 'vencimientos' ? 'active' : ''} ${hasVencimientosPendientes && !loadingVencimientoCheck ? 'has-pending-vencimientos-button' : ''}`}
                        onClick={() => changeActiveView('vencimientos')}
                    >
                        {hasVencimientosPendientes && !loadingVencimientoCheck && <span className="vencimiento-dot pulsating-dot"></span>}
                        Próximos Vencimientos
                    </button>
                </nav>

                {hasVencimientosPendientes && !loadingVencimientoCheck && (
                    <div className="vencimiento-alert-box">
                        <span className="alert-icon">⚠️</span>
                        <p className="vencimiento-alert-text">
                            ¡Atención! Hay vencimientos por revisar.
                        </p>
                    </div>
                )}

                <button
                    className="mode-toggle-button"
                    onClick={toggleMode}
                    disabled={activeView !== 'estructuras'}
                    title={activeView !== 'estructuras' ? "Disponible sólo en la vista de Estructuras" : ""}
                >
                    {buttonModeText}
                </button>

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
                <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <p style={{ fontStyle: 'italic', color: '#555' }}>
                        Vista: <strong>
                            {activeView === 'estructuras' && 'Estructuras'}
                            {activeView === 'prestamos' && 'Expedientes en Préstamo'}
                            {activeView === 'vencimientos' && 'Próximos Vencimientos'}
                            {activeView === 'dashboard_general' && 'Dashboard General'} {/* <-- ETIQUETA PARA LA NUEVA VISTA */}
                        </strong>
                        {activeView === 'estructuras' && ` / Modo: ${currentMode === 'consulta' ? 'Consulta' : 'Edición'}`}
                    </p>
                </div>
                {renderMainContent()}
            </main>
        </div>
    );
};