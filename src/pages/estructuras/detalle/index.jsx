// src/pages/estructuras/detalle/EstructuraDetalle.jsx

import React, { useState, useEffect } from 'react'; // useCallback ya no es estrictamente necesario aquí si no se pasan funciones que lo requieran a useMemo o useEffect sin cambiar
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';

// Vistas de Subsección
import { AntecedentesSocietariosView } from './AntecedentesSocietariosView';
import { ExpedientesAsociadosView } from './ExpedientesAsociadosView';
import { ExpedientesMensualesView } from './ExpedientesMensualesView';
import { EstadosDeCuentaView } from './EstadosDeCuentaView';
import { DashboardEstructuraView } from '../graficos/DashboardEstructuraView'; 

// Modales
import { AddAntecedenteModal } from '../../../modals/AddAntecedenteModal';
import { EditAntecedenteModal } from '../../../modals/EditAntecedenteModal';
import { AddEstadoCuentaModal } from '../../../modals/AddEstadoCuentaModal';
import { EditEstadoCuentaModal } from '../../../modals/EditEstadoCuentaModal';
import { AddPrestamoModal } from '../../../modals/AddPrestamoModal';
import { AddExpedienteMensualModal } from '../../../modals/AddExpedienteMensualModal';

// Hooks Personalizados
import { useEstructuraData } from '../../../hooks/useEstructuraData';
import { useAntecedentesLogic } from '../../../hooks/useAntecedentesLogic';
import { useExpedientesLogic } from '../../../hooks/useExpedientesLogic';
import { useExpedientesMensualesLogic } from '../../../hooks/useExpedientesMensualesLogic';
import { useEstadosCuentaLogic } from '../../../hooks/useEstadosCuentaLogic';
import { useChecksLogic } from '../../../hooks/useChecksLogic';
import { usePrestamosLogic } from '../../../hooks/usePrestamosLogic';

import './EstructuraDetalle.css';

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate) { date = timestamp.toDate();
    } else if (timestamp.seconds && typeof timestamp.seconds === 'number') { date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
        if (typeof timestamp === 'string' && timestamp.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const parts = timestamp.split('-');
            date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        }
    } else if (timestamp instanceof Date) { date = timestamp;
    } else { return 'Fecha inválida (tipo)';}
    if (isNaN(date.getTime())) return 'Fecha inválida (valor)';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

// El DashboardEstructuraViewPlaceholder se elimina de aquí, ya que se importa el componente real.

export const EstructuraDetalle = () => {
    const { estructuraId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state;
    const [activeSubView, setActiveSubView] = useState(locationState?.activeTab || 'antecedentes');

    const { estructura, loadingEstructura, errorEstructura } = useEstructuraData(estructuraId);

    const {
        antecedentesArray, expandedAntecedenteIndex, isAddAntecedenteModalOpen,
        isEditAntecedenteModalOpen, antecedenteToEdit, handleOpenAddAntecedenteModal,
        handleCloseAddAntecedenteModal, handleSaveAntecedente, handleOpenEditAntecedenteModal,
        handleCloseEditAntecedenteModal, handleUpdateAntecedente, toggleExpandAntecedente,
    } = useAntecedentesLogic(estructura);

    const {
        expedientes: expedientesGenerales,
        loadingExpedientes: loadingExpedientesGenerales,
        errorExpedientes: errorExpedientesGenerales,
        isCreatingDefaults: isCreatingDefaultsGenerales,
        fetchExpedientes: fetchExpedientesGenerales,
        handleUpdateExpedienteEnDetalle: handleUpdateExpedienteGeneral,
        addDefaultExpedientesToEstructura: addDefaultExpGenerales
    } = useExpedientesLogic(estructuraId);

    const {
        expedientesMensuales,
        loadingExpedientesMensuales,
        errorExpedientesMensuales,
        isCreatingDefaultMensuales,
        fetchExpedientesMensuales,
        addDefaultExpedientesMensualesToEstructura,
        handleUpdateExpedienteMensual,
        addNewCustomExpedienteMensual
    } = useExpedientesMensualesLogic(estructuraId);

    const [isAddCustomExpMensualModalOpen, setIsAddCustomExpMensualModalOpen] = useState(false);
    const handleOpenAddCustomExpMensualModal = () => setIsAddCustomExpMensualModalOpen(true);
    const handleCloseAddCustomExpMensualModal = () => setIsAddCustomExpMensualModalOpen(false);

    const handleSaveNuevoCustomExpMensual = async (nuevoExpData) => {
        if (!estructuraId) { alert("ID de estructura no disponible."); return; }
        const result = await addNewCustomExpedienteMensual(estructuraId, nuevoExpData);
        if (result.success) {
            alert(result.message);
            await fetchExpedientesMensuales();
        } else {
            alert(result.message || "Error al guardar el nuevo tipo de expediente mensual.");
        }
        handleCloseAddCustomExpMensualModal();
    };

    const {
        estadosCuenta, loadingEstadosCuenta, errorEstadosCuenta, fetchEstadosDeCuenta,
        isAddEstadoCuentaModalOpen, handleOpenAddEstadoCuentaModal, handleCloseAddEstadoCuentaModal,
        handleSaveNuevoEstadoCuenta, isEditEstadoCuentaModalOpen, estadoCuentaToEdit,
        handleOpenEditEstadoCuentaModal, handleCloseEditEstadoCuentaModal, handleUpdateEstadoCuenta,
    } = useEstadosCuentaLogic(estructuraId);

    const {
        currentAnoChecks, checksDataForYear, loadingChecks, errorChecks,
        handleAnoChange: handleAnoChecksChange,
        handleUpdateMonthData: handleUpdateChecksData,
        handleInitializeYear: handleInitializeYearlyChecks,
    } = useChecksLogic(estructuraId);

    const {
        isAddPrestamoModalOpen, openAddPrestamoModal, closeAddPrestamoModal,
        saveNuevoPrestamo, isSavingPrestamo,
    } = usePrestamosLogic();
    const [expedienteParaPrestamo, setExpedienteParaPrestamo] = useState(null);

    const handleOpenPrestamoModalForExpediente = (expedienteInfo) => {
        setExpedienteParaPrestamo(expedienteInfo); openAddPrestamoModal();
    };
    const handleClosePrestamoModal = () => {
        closeAddPrestamoModal(); setExpedienteParaPrestamo(null);
    };
    const handleSavePrestamoWrapper = async (prestamoDataFromModal) => {
        if (!expedienteParaPrestamo?.id || !estructuraId) {
            throw new Error("No se pudo determinar el expediente para el préstamo.");
        }
        try {
            await saveNuevoPrestamo(prestamoDataFromModal, estructuraId, expedienteParaPrestamo.id);
            setExpedienteParaPrestamo(null);
        } catch (error) {
            throw error;
        }
    };

    const handleAddDefaultGeneralesClick = async () => {
        if (!estructuraId) { alert("Error: No se ha identificado la estructura actual."); return; }
        const result = await addDefaultExpGenerales(estructuraId);
        if (result && result.success) {
            alert(result.message || "Expedientes generales procesados.");
            await fetchExpedientesGenerales();
        } else {
            alert(result?.message || "Error al cargar expedientes generales.");
        }
    };

    const handleAddDefaultMensualesClick = async () => {
        if (!estructuraId) { alert("Error: No se ha identificado la estructura actual."); return; }
        const result = await addDefaultExpedientesMensualesToEstructura(estructuraId);
        if (result && result.success) {
            alert(result.message || "Expedientes mensuales procesados.");
            await fetchExpedientesMensuales();
        } else {
            alert(result?.message || "Error al cargar expedientes mensuales.");
        }
    };

    useEffect(() => {
        if (estructuraId) {
            if (activeSubView === 'expedientes') {
                fetchExpedientesGenerales();
            } else if (activeSubView === 'exp_mensuales') {
                fetchExpedientesMensuales();
            } else if (activeSubView === 'estados_cuenta') {
                fetchEstadosDeCuenta();
            } else if (activeSubView === 'dashboard_estructura') { // <-- AÑADIDO PARA EL DASHBOARD DE ESTRUCTURA
                // Asegurar que los datos de expedientes mensuales estén cargados para el dashboard
                // Si ya se cargaron por la vista 'exp_mensuales', no es estrictamente necesario volver a llamar
                // pero por consistencia y si el usuario navega directo, es bueno tenerlo.
                // Podrías añadir una condición para no recargar si ya existen y no están loading.
                fetchExpedientesMensuales();
            }
            // else if (activeSubView === 'antecedentes') { /* Lógica de carga de antecedentes si es necesario */ }
        }
    }, [activeSubView, estructuraId, fetchExpedientesGenerales, fetchExpedientesMensuales, fetchEstadosDeCuenta]);

    if (loadingEstructura) return <div className="detalle-status-container"><p>Cargando estructura...</p></div>;
    if (errorEstructura) return <div className="detalle-status-container error"><p>{errorEstructura}</p></div>;
    if (!estructura) return <div className="detalle-status-container"><p>No hay datos de la estructura.</p></div>;

    return (
        <div className="estructura-detalle-container">
            <button onClick={() => navigate(-1)} className="button-back">&larr; Volver</button>
            <h1>{estructura.RazonSocial || "Detalle de Estructura"}</h1>

            <div className="detalle-seccion main-details">
                <h2>Información General</h2>
                <p><strong>Razón Social:</strong> {estructura.RazonSocial || 'N/A'}</p>
                <p><strong>Tipo:</strong> {estructura.Tipo || 'N/A'}</p>
                <p><strong>Estatus:</strong> {estructura.Estatus || 'N/A'}</p>
                <p><strong>Uso:</strong> {estructura.Uso || 'N/A'}</p>
                <p><strong>Observaciones:</strong> {estructura.Observaciones || 'N/A'}</p>
            </div>

            <div className="subview-toggle-buttons">
                <button className={`subview-button ${activeSubView === 'antecedentes' ? 'active' : ''}`} onClick={() => setActiveSubView('antecedentes')}>Antecedentes</button>
                <button className={`subview-button ${activeSubView === 'expedientes' ? 'active' : ''}`} onClick={() => setActiveSubView('expedientes')}>Exp. Generales</button>
                <button className={`subview-button ${activeSubView === 'exp_mensuales' ? 'active' : ''}`} onClick={() => setActiveSubView('exp_mensuales')}>Exp. Mensuales</button>
                <button className={`subview-button ${activeSubView === 'dashboard_estructura' ? 'active' : ''}`} onClick={() => setActiveSubView('dashboard_estructura')}>Dashboard</button> {/* <-- NUEVO BOTÓN */}
                <button className={`subview-button ${activeSubView === 'estados_cuenta' ? 'active' : ''}`} onClick={() => setActiveSubView('estados_cuenta')}>Cuentas y Control</button>
            </div>

            {activeSubView === 'antecedentes' && (
                <AntecedentesSocietariosView
                    antecedentes={antecedentesArray}
                    expandedIndex={expandedAntecedenteIndex}
                    onToggleExpand={toggleExpandAntecedente}
                    onOpenAddModal={handleOpenAddAntecedenteModal}
                    onOpenEditModal={handleOpenEditAntecedenteModal}
                    formatDate={formatDate}
                />
            )}

            {activeSubView === 'expedientes' && (
                <>
                    <div style={{ margin: "20px 0", textAlign: "right" }}>
                        <button onClick={handleAddDefaultGeneralesClick} disabled={isCreatingDefaultsGenerales || loadingExpedientesGenerales} className="button-primary">
                            {isCreatingDefaultsGenerales ? "Cargando..." : "Cargar Exp. Generales Pred."}
                        </button>
                    </div>
                    <ExpedientesAsociadosView
                        estructuraId={estructuraId}
                        estructuraNombre={estructura?.RazonSocial}
                        expedientes={expedientesGenerales}
                        loading={loadingExpedientesGenerales || isCreatingDefaultsGenerales}
                        error={errorExpedientesGenerales}
                        onUpdateExpediente={handleUpdateExpedienteGeneral}
                        formatDate={formatDate}
                        onOpenPrestamoModal={handleOpenPrestamoModalForExpediente}
                        highlightedExpedienteId={locationState?.highlightExpediente}
                    />
                </>
            )}

            {activeSubView === 'exp_mensuales' && (
                <>
                    <div style={{ margin: "20px 0", textAlign: "right" }}>
                        <button onClick={handleAddDefaultMensualesClick} disabled={isCreatingDefaultMensuales || loadingExpedientesMensuales} className="button-primary">
                            {isCreatingDefaultMensuales ? "Cargando..." : "Cargar Exp. Mensuales Pred."}
                        </button>
                    </div>
                    <ExpedientesMensualesView
                        expedientesMensuales={expedientesMensuales}
                        loading={loadingExpedientesMensuales || isCreatingDefaultMensuales}
                        error={errorExpedientesMensuales}
                        estructuraId={estructuraId}
                        estructuraNombre={estructura?.RazonSocial}
                        onUpdateExpedienteMensual={handleUpdateExpedienteMensual}
                        onOpenAddModal={handleOpenAddCustomExpMensualModal}
                        formatDate={formatDate}
                    />
                </>
            )}

            {activeSubView === 'dashboard_estructura' && ( // <-- NUEVA SECCIÓN DE RENDERIZADO
                <DashboardEstructuraView // Usando el componente importado
                    estructuraId={estructuraId}
                    estructuraNombre={estructura?.RazonSocial || "Esta Estructura"}
                    expedientesMensuales={expedientesMensuales} 
                    expedientesGenerales={expedientesGenerales}
                    loading={loadingExpedientesMensuales} 
                    error={errorExpedientesMensuales}    
                    formatDate={formatDate}
                />
            )}

            {activeSubView === 'estados_cuenta' && (
                <EstadosDeCuentaView
                    estadosCuenta={estadosCuenta}
                    loading={loadingEstadosCuenta}
                    error={errorEstadosCuenta}
                    formatDate={formatDate}
                    onOpenAddModal={handleOpenAddEstadoCuentaModal}
                    onOpenEditModal={handleOpenEditEstadoCuentaModal}
                    estructuraId={estructuraId}
                    initialAnoChecks={currentAnoChecks}
                    checksDataForYear={checksDataForYear}
                    loadingChecks={loadingChecks}
                    errorChecks={errorChecks}
                    onAnoChecksChange={handleAnoChecksChange}
                    onUpdateChecksData={handleUpdateChecksData}
                    onInitializeYearlyChecks={handleInitializeYearlyChecks}
                />
            )}

            {/* Modales */}
            <AddAntecedenteModal isOpen={isAddAntecedenteModalOpen} onClose={handleCloseAddAntecedenteModal} onSave={handleSaveAntecedente}/>
            <EditAntecedenteModal isOpen={isEditAntecedenteModalOpen} onClose={handleCloseEditAntecedenteModal} onUpdate={handleUpdateAntecedente} initialData={antecedenteToEdit}/>
            <AddExpedienteMensualModal isOpen={isAddCustomExpMensualModalOpen} onClose={handleCloseAddCustomExpMensualModal} onSave={handleSaveNuevoCustomExpMensual} estructuraId={estructuraId}/>
            <AddEstadoCuentaModal isOpen={isAddEstadoCuentaModalOpen} onClose={handleCloseAddEstadoCuentaModal} onSave={handleSaveNuevoEstadoCuenta} estructuraId={estructuraId} />
            <EditEstadoCuentaModal isOpen={isEditEstadoCuentaModalOpen} onClose={handleCloseEditEstadoCuentaModal} onUpdate={handleUpdateEstadoCuenta} initialData={estadoCuentaToEdit} />
            <AddPrestamoModal isOpen={isAddPrestamoModalOpen} onClose={handleClosePrestamoModal} onSavePrestamo={handleSavePrestamoWrapper} expedienteId={expedienteParaPrestamo?.id} expedienteNombre={expedienteParaPrestamo?.nombre} />
        </div>
    );
};