// src/pages/estructuras/detalle/EstructuraDetalle.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Vistas de Subsección
import { AntecedentesSocietariosView } from './AntecedentesSocietariosView';
import { ExpedientesAsociadosView } from './ExpedientesAsociadosView';
import { EstadosDeCuentaView } from './EstadosDeCuentaView';

// Modales
import { AddAntecedenteModal } from '../../../modals/AddAntecedenteModal';
import { EditAntecedenteModal } from '../../../modals/EditAntecedenteModal';
// import { AddDocumentoModal } from '../../../modals/AddDocument'; // ELIMINADO: Ya no se añaden expedientes individualmente así
import { AddEstadoCuentaModal } from '../../../modals/AddEstadoCuentaModal';
import { EditEstadoCuentaModal } from '../../../modals/EditEstadoCuentaModal';
import { AddPrestamoModal } from '../../../modals/AddPrestamoModal';

// Hooks Personalizados
import { useEstructuraData } from '../../../hooks/useEstructuraData';
import { useAntecedentesLogic } from '../../../hooks/useAntecedentesLogic';
import { useExpedientesLogic } from '../../../hooks/useExpedientesLogic'; // Asumimos que este hook está actualizado
import { useEstadosCuentaLogic } from '../../../hooks/useEstadosCuentaLogic';
import { useChecksLogic } from '../../../hooks/useChecksLogic';
import { usePrestamosLogic } from '../../../hooks/usePrestamosLogic';

import './EstructuraDetalle.css';

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate) { // Objeto Timestamp de Firebase
        date = timestamp.toDate();
    } else if (timestamp.seconds && typeof timestamp.seconds === 'number') { // Objeto con seconds/nanoseconds
        date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp); // Intentar parsear strings o números directamente
        // Si es un string YYYY-MM-DD, ajustar para UTC para evitar problemas de zona horaria
        if (typeof timestamp === 'string' && timestamp.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const parts = timestamp.split('-');
            date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        }
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return 'Fecha inválida (tipo)';
    }

    if (isNaN(date.getTime())) return 'Fecha inválida (valor)';

    // Usar UTC para la visualización para consistencia si las fechas se guardan como UTC medianoche
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short', // 'long' para nombre completo, 'short' para abreviado
        year: 'numeric',
        timeZone: 'UTC' // Importante si las fechas son UTC y quieres evitar desplazamientos
    });
};


export const EstructuraDetalle = () => {
    const { estructuraId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state;
    const [activeSubView, setActiveSubView] = useState(locationState?.activeTab || 'antecedentes');

    const { estructura, loadingEstructura, errorEstructura, fetchEstructuraDetalle } = useEstructuraData(estructuraId);

    const {
        antecedentesArray, expandedAntecedenteIndex, isAddAntecedenteModalOpen,
        isEditAntecedenteModalOpen, antecedenteToEdit, handleOpenAddAntecedenteModal,
        handleCloseAddAntecedenteModal, handleSaveAntecedente, handleOpenEditAntecedenteModal,
        handleCloseEditAntecedenteModal, handleUpdateAntecedente, toggleExpandAntecedente,
    } = useAntecedentesLogic(estructura, fetchEstructuraDetalle);

    // Destructuring actualizado para useExpedientesLogic
    const {
        expedientes,
        loadingExpedientes,
        errorExpedientes,
        isCreatingDefaults, // Nuevo estado para la carga de expedientes predeterminados
        fetchExpedientes,
        handleUpdateExpedienteEnDetalle, // Para editar los expedientes existentes
        addDefaultExpedientesToEstructura // Nueva función para añadir los 26 expedientes
    } = useExpedientesLogic(estructuraId);

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
        saveNuevoPrestamo,
        isSavingPrestamo, // Corregido el posible typo de 'iseSavingPrestamo'
    } = usePrestamosLogic();

    const [expedienteParaPrestamo, setExpedienteParaPrestamo] = useState(null);

    const handleOpenPrestamoModalForExpediente = (expedienteInfo) => {
        setExpedienteParaPrestamo(expedienteInfo);
        openAddPrestamoModal();
    };

    const handleClosePrestamoModal = () => {
        closeAddPrestamoModal();
        setExpedienteParaPrestamo(null);
    };

    const handleSavePrestamoWrapper = async (prestamoDataFromModal) => {
        if (!expedienteParaPrestamo?.id || !estructuraId) {
            console.error("Falta ID de expediente o estructura para guardar el préstamo.");
            throw new Error("No se pudo determinar el expediente o la estructura para el préstamo.");
        }
        try {
            await saveNuevoPrestamo(
                prestamoDataFromModal,
                estructuraId,
                expedienteParaPrestamo.id
            );
            setExpedienteParaPrestamo(null);
        } catch (error) {
            console.error("Error al guardar préstamo desde EstructuraDetalle:", error);
            throw error;
        }
    };

    // Manejador para el botón de añadir expedientes predeterminados
    const handleAddDefaultExpedientesClick = async () => {
        if (!estructuraId) {
            alert("Error: No se ha identificado la estructura actual.");
            return;
        }
        const result = await addDefaultExpedientesToEstructura(estructuraId);
        // Asegurarse de que result y result.success existan antes de acceder a result.message
        if (result && result.success) {
            alert(result.message || "Expedientes predeterminados procesados.");
            await fetchExpedientes(); // Recargar la lista de expedientes
        } else {
            alert(result?.message || "Ocurrió un error inesperado al cargar los expedientes predeterminados.");
        }
    };

    useEffect(() => {
        // fetchEstructuraDetalle() es llamado por useEstructuraData internamente,
        // no es necesario llamarlo aquí explícitamente si ese es el caso.
    }, [estructuraId]);

    useEffect(() => {
        if (activeSubView === 'expedientes' && estructuraId) {
            fetchExpedientes();
        } else if (activeSubView === 'estados_cuenta' && estructuraId) {
            fetchEstadosDeCuenta();
        }
        // Añadir otras cargas de datos para subvistas si es necesario
    }, [activeSubView, estructuraId, fetchExpedientes, fetchEstadosDeCuenta]);

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
                <button
                    className={`subview-button ${activeSubView === 'antecedentes' ? 'active' : ''}`}
                    onClick={() => setActiveSubView('antecedentes')}
                >
                    Antecedentes Societarios
                </button>
                <button
                    className={`subview-button ${activeSubView === 'expedientes' ? 'active' : ''}`}
                    onClick={() => setActiveSubView('expedientes')}
                >
                    Expedientes Asociados
                </button>
                <button
                    className={`subview-button ${activeSubView === 'estados_cuenta' ? 'active' : ''}`}
                    onClick={() => setActiveSubView('estados_cuenta')}
                >
                    Cuentas Bancarias y Control
                </button>
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
                        <button
                            onClick={handleAddDefaultExpedientesClick}
                            disabled={isCreatingDefaults || loadingExpedientes}
                            className="button-prestamo" // Usa tu clase de botón primario o una adecuada
                        >
                            {isCreatingDefaults ? "Cargando Predeterminados..." : "Cargar Expedientes Predeterminados"}
                        </button>
                    </div>
                    <ExpedientesAsociadosView
                        estructuraId={estructuraId}
                        estructuraNombre={estructura?.RazonSocial || `Estructura ${estructuraId}`}
                        expedientes={expedientes}
                        loading={loadingExpedientes || isCreatingDefaults} // Combinar estados de carga
                        error={errorExpedientes}
                        // onOpenAddModal prop ya no se pasa porque se eliminó la funcionalidad de añadir expedientes individualmente
                        onUpdateExpediente={handleUpdateExpedienteEnDetalle}
                        formatDate={formatDate}
                        onOpenPrestamoModal={handleOpenPrestamoModalForExpediente}
                        highlightedExpedienteId={locationState?.highlightExpediente}
                    />
                </>
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
            <AddAntecedenteModal
                isOpen={isAddAntecedenteModalOpen}
                onClose={handleCloseAddAntecedenteModal}
                onSave={handleSaveAntecedente}
            />
            <EditAntecedenteModal
                isOpen={isEditAntecedenteModalOpen}
                onClose={handleCloseEditAntecedenteModal}
                onUpdate={handleUpdateAntecedente}
                initialData={antecedenteToEdit}
            />
            {/* AddDocumentoModal ya no es necesario aquí si los expedientes
                solo se cargan mediante el botón de "Cargar Expedientes Predeterminados"
                y luego se editan.
            */}
            <AddEstadoCuentaModal
                isOpen={isAddEstadoCuentaModalOpen}
                onClose={handleCloseAddEstadoCuentaModal}
                onSave={handleSaveNuevoEstadoCuenta}
                estructuraId={estructuraId}
            />
            <EditEstadoCuentaModal
                isOpen={isEditEstadoCuentaModalOpen}
                onClose={handleCloseEditEstadoCuentaModal}
                onUpdate={handleUpdateEstadoCuenta}
                initialData={estadoCuentaToEdit}
            />
            <AddPrestamoModal
                isOpen={isAddPrestamoModalOpen}
                onClose={handleClosePrestamoModal}
                onSavePrestamo={handleSavePrestamoWrapper}
                expedienteId={expedienteParaPrestamo?.id ?? ''}
                expedienteNombre={expedienteParaPrestamo?.nombre ?? 'Expediente'}
            />
        </div>
    );
};