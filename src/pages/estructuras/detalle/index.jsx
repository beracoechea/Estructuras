import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Vistas de Subsección
import { AntecedentesSocietariosView } from './AntecedentesSocietariosView';
import { ExpedientesAsociadosView } from './ExpedientesAsociadosView';
import { ExpedientesMensualesView } from './ExpedientesMensualesView';
import { EstadosDeCuentaView } from './EstadosDeCuentaView';
import { DashboardEstructuraView } from '../graficos/DashboardEstructuraView';
import { ContabilidadView } from './ContabilidadView';
import { PersonalView } from './PersonalView';

// Modales
import { AddAntecedenteModal } from '../../../modals/AddAntecedenteModal';
import { EditAntecedenteModal } from '../../../modals/EditAntecedenteModal';
import { AddEstadoCuentaModal } from '../../../modals/AddEstadoCuentaModal';
import { EditEstadoCuentaModal } from '../../../modals/EditEstadoCuentaModal';
import { AddPrestamoModal } from '../../../modals/AddPrestamoModal';
import { AddExpedienteMensualModal } from '../../../modals/AddExpedienteMensualModal';
import { AddContabilidadModal } from '../../../modals/AddContabilidadModal';

// Hooks Personalizados
import { useEstructuraData } from '../../../hooks/useEstructuraData';
import { useAntecedentesLogic } from '../../../hooks/useAntecedentesLogic';
import { useExpedientesLogic } from '../../../hooks/useExpedientesLogic';
import { useExpedientesMensualesLogic } from '../../../hooks/useExpedientesMensualesLogic';
import { useEstadosCuentaLogic } from '../../../hooks/useEstadosCuentaLogic';
import { useChecksLogic } from '../../../hooks/useChecksLogic';
import { usePrestamosLogic } from '../../../hooks/usePrestamosLogic';
import { useContabilidadLogic } from '../../../hooks/useContabilidadLogic';
import { usePersonalLogic } from '../../../hooks/usePersonalLogic';

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

export const EstructuraDetalle = () => {
    const { estructuraId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state;
    const [activeSubView, setActiveSubView] = useState(locationState?.activeTab || 'personal');

    const { estructura, loadingEstructura, errorEstructura } = useEstructuraData(estructuraId);

    // --- Hooks de cada sección ---
    const {
        antecedentesArray, expandedAntecedenteIndex, isAddAntecedenteModalOpen,
        isEditAntecedenteModalOpen, antecedenteToEdit, handleOpenAddAntecedenteModal,
        handleCloseAddAntecedenteModal, handleSaveAntecedente, handleOpenEditAntecedenteModal,
        handleCloseEditAntecedenteModal, handleUpdateAntecedente, toggleExpandAntecedente,
    } = useAntecedentesLogic(estructura);

    const {
        expedientes: expedientesGenerales, loadingExpedientes: loadingExpedientesGenerales,
        errorExpedientes: errorExpedientesGenerales, isCreatingDefaults: isCreatingDefaultsGenerales,
        fetchExpedientes: fetchExpedientesGenerales,
        handleUpdateExpedienteEnDetalle: handleUpdateExpedienteGeneral,
        addDefaultExpedientesToEstructura: addDefaultExpGenerales
    } = useExpedientesLogic(estructuraId);

    const {
        expedientesMensuales, loadingExpedientesMensuales, errorExpedientesMensuales,
        isCreatingDefaultMensuales, fetchExpedientesMensuales, addDefaultExpedientesMensualesToEstructura,
        handleUpdateExpedienteMensual, addNewCustomExpedienteMensual // Necesario para el modal
    } = useExpedientesMensualesLogic(estructuraId);

    const {
        contabilidadItems, loadingContabilidad, errorContabilidad,
        isCreatingDefaultContabilidad, fetchContabilidadData, addDefaultContabilidadItemsToEstructura,
        handleUpdateContabilidadItem, addNewCustomContabilidadItem // Necesario para el modal
    } = useContabilidadLogic(estructuraId);

    // Hook de Personal (con la estructura correcta para el modelo híbrido)
    const {
        personalIndex,
        selectedEmpleadoDetails,
        loadingPersonal,
        errorPersonal,
        fetchPersonalIndex,
        fetchEmpleadoDetails,
        addEmpleado,
        updateDocumentoStatus,
        // addCustomDocumento, // Asegúrate de que tu hook usePersonalLogic lo retorne si lo usas en PersonalView
    } = usePersonalLogic(estructuraId);

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
    } = usePrestamosLogic();
    
    // --- State y Handlers para Modales (que no vienen de hooks) ---
    const [expedienteParaPrestamo, setExpedienteParaPrestamo] = useState(null);
    const [isAddContabilidadModalOpen, setIsAddContabilidadModalOpen] = useState(false);
    const [isAddCustomExpMensualModalOpen, setIsAddCustomExpMensualModalOpen] = useState(false);

    const openAddContabilidadModalHandler = () => setIsAddContabilidadModalOpen(true);
    const closeAddContabilidadModalHandler = () => setIsAddContabilidadModalOpen(false);
    const handleOpenAddCustomExpMensualModal = () => setIsAddCustomExpMensualModalOpen(true);
    const handleCloseAddCustomExpMensualModal = () => setIsAddCustomExpMensualModalOpen(false);
    
    const handleOpenPrestamoModalForExpediente = (expedienteInfo) => {
        setExpedienteParaPrestamo(expedienteInfo);
        openAddPrestamoModal();
    };
    
    const handleSavePrestamoWrapper = async (prestamoDataFromModal) => {
        if (!expedienteParaPrestamo?.id || !estructuraId) {
            throw new Error("No se pudo determinar el expediente para el préstamo.");
        }
        try {
            await saveNuevoPrestamo(prestamoDataFromModal, estructuraId, expedienteParaPrestamo.id);
            setExpedienteParaPrestamo(null); // Cierra el modal y limpia el estado
            closeAddPrestamoModal();
        } catch (error) {
            console.error("Error al guardar préstamo:", error);
            alert("Error al guardar el préstamo: " + error.message);
            // Considera no cerrar el modal aquí para que el usuario pueda reintentar o corregir.
        }
    };

    // Handlers para los modales que causaban error (definidos aquí)
    const handleSaveNuevoContabilidadItem = async (nuevoItemData) => {
        if (!estructuraId) { alert("ID de estructura no disponible."); return; }
        // addNewCustomContabilidadItem viene de useContabilidadLogic
        const result = await addNewCustomContabilidadItem(estructuraId, nuevoItemData);
        if (result && result.success) {
            alert(result.message || "Registro contable guardado.");
            await fetchContabilidadData();
        } else {
            alert(result?.message || "Error al guardar el nuevo registro contable.");
        }
        closeAddContabilidadModalHandler();
    };

     const handleAddDefaultContabilidad = async () => {
    const result = await addDefaultContabilidadItemsToEstructura(estructuraId);

    if (result && result.success) {
      alert(result.message || "Registros predeterminados añadidos con éxito.");
      
      fetchContabilidadData();
    } else {
      alert(result?.message || "Error al añadir los registros predeterminados.");
    }
  };
  const handleAddDefaultExpMensuales = async () => {
    const result = await addDefaultExpedientesMensualesToEstructura(estructuraId);

    if (result && result.success) {
        alert(result.message || "Expedientes mensuales predeterminados añadidos.");

        fetchExpedientesMensuales();
    } else {
        alert(result?.message || "Error al añadir los expedientes mensuales.");
    }
};
const handleAddDefaultExpGeneralesHandler = async () => {
    // Llama a la función del hook para añadir los expedientes a la BD
    const result = await addDefaultExpGenerales(estructuraId); // Usamos la función correcta del hook useExpedientesLogic

    // Comprueba si la operación fue exitosa
    if (result && result.success) {
        alert(result.message || "Expedientes generales predeterminados añadidos.");

        // ¡LA CLAVE! Vuelve a cargar los datos para refrescar la interfaz
        fetchExpedientesGenerales();
    } else {
        alert(result?.message || "Error al añadir los expedientes generales.");
    }
};

    const handleSaveNuevoCustomExpMensual = async (nuevoExpData) => {
        if (!estructuraId) { alert("ID de estructura no disponible."); return; }
        // addNewCustomExpedienteMensual viene de useExpedientesMensualesLogic
        const result = await addNewCustomExpedienteMensual(estructuraId, nuevoExpData);
        if (result && result.success) {
            alert(result.message || "Expediente mensual personalizado guardado.");
            await fetchExpedientesMensuales();
        } else {
            alert(result?.message || "Error al guardar el nuevo tipo de expediente mensual.");
        }
        handleCloseAddCustomExpMensualModal();
    };
    
    // --- Lógica para cargar datos al cambiar de vista ---
    useEffect(() => {
        if (!estructuraId) return;

        switch (activeSubView) {
            case 'antecedentes':
                // La lógica de antecedentes se basa en el objeto 'estructura', no requiere fetch.
                break;
            case 'expedientes':
                fetchExpedientesGenerales();
                break;
            case 'exp_mensuales':
                fetchExpedientesMensuales();
                break;
            case 'estados_cuenta':
                fetchEstadosDeCuenta();
                break;
            case 'dashboard_estructura':
                fetchExpedientesMensuales();
                fetchExpedientesGenerales();
                break;
            case 'contabilidad':
                fetchContabilidadData();
                break;
            case 'personal':
                fetchPersonalIndex(); // Se llama a la función correcta
                break;
            default:
                break;
        }
    }, [activeSubView, estructuraId]); // Las dependencias de fetch se quitan si son estables (useCallback sin deps cambiantes)

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
                <button className={`subview-button ${activeSubView === 'dashboard_estructura' ? 'active' : ''}`} onClick={() => setActiveSubView('dashboard_estructura')}>Dashboard</button>
                <button className={`subview-button ${activeSubView === 'estados_cuenta' ? 'active' : ''}`} onClick={() => setActiveSubView('estados_cuenta')}>Cuentas y Control</button>
                <button className={`subview-button ${activeSubView === 'contabilidad' ? 'active' : ''}`} onClick={() => setActiveSubView('contabilidad')}>Contabilidad</button>
                <button className={`subview-button ${activeSubView === 'personal' ? 'active' : ''}`} onClick={() => setActiveSubView('personal')}>Personal</button>
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
                 <ExpedientesAsociadosView
                    estructuraId={estructuraId}
                    estructuraNombre={estructura?.RazonSocial}
                    expedientes={expedientesGenerales}
                    loading={loadingExpedientesGenerales || isCreatingDefaultsGenerales}
                    error={errorExpedientesGenerales}
                     onAddDefaultExpedientes={handleAddDefaultExpGeneralesHandler}
                    onUpdateExpediente={handleUpdateExpedienteGeneral}
                    formatDate={formatDate}
                    onOpenPrestamoModal={handleOpenPrestamoModalForExpediente}
                    highlightedExpedienteId={locationState?.highlightExpediente}
                />
            )}
            {activeSubView === 'exp_mensuales' && (
                <ExpedientesMensualesView
                    estructuraId={estructuraId}
                    estructuraNombre={estructura?.RazonSocial}
                    expedientesMensuales={expedientesMensuales}
                    loading={loadingExpedientesMensuales || isCreatingDefaultMensuales}
                    error={errorExpedientesMensuales}
                    onUpdateExpedienteMensual={handleUpdateExpedienteMensual}
                    onAddDefaultExpedientesMensuales={handleAddDefaultExpMensuales}
                    formatDate={formatDate}
                />
            )}
            {activeSubView === 'dashboard_estructura' && (
                <DashboardEstructuraView
                    estructuraId={estructuraId}
                    estructuraNombre={estructura?.RazonSocial || "Esta Estructura"}
                    expedientesMensuales={expedientesMensuales}
                    expedientesGenerales={expedientesGenerales}
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
            {activeSubView === 'contabilidad' && (
                <ContabilidadView
                    contabilidadData={contabilidadItems} 
                    loading={loadingContabilidad || isCreatingDefaultContabilidad}
                    error={errorContabilidad}
                    estructuraNombre={estructura?.RazonSocial}
                    onUpdateContabilidad={handleUpdateContabilidadItem}
                    onAddDefaultContabilidadItems={handleAddDefaultContabilidad} 
                    onOpenAddModal={openAddContabilidadModalHandler}
                    />
            )}
            
            {activeSubView === 'personal' && (
                <PersonalView
                    personalIndex={personalIndex}
                    selectedEmpleadoDetails={selectedEmpleadoDetails}
                    loading={loadingPersonal}
                    error={errorPersonal}
                    // formatDate no es necesario aquí, a menos que PersonalView lo use
                    handlers={{
                        fetchEmpleadoDetails,
                        addEmpleado,
                        updateDocumentoStatus,
                        // addCustomDocumento, // Si lo implementas y necesitas en PersonalView
                    }}
                />
            )}

            {/* --- Modales --- */}
            <AddAntecedenteModal isOpen={isAddAntecedenteModalOpen} onClose={handleCloseAddAntecedenteModal} onSave={handleSaveAntecedente}/>
            <EditAntecedenteModal isOpen={isEditAntecedenteModalOpen} onClose={handleCloseEditAntecedenteModal} onUpdate={handleUpdateAntecedente} initialData={antecedenteToEdit}/>
            <AddExpedienteMensualModal isOpen={isAddCustomExpMensualModalOpen} onClose={handleCloseAddCustomExpMensualModal} onSave={handleSaveNuevoCustomExpMensual} estructuraId={estructuraId}/>
            <AddEstadoCuentaModal isOpen={isAddEstadoCuentaModalOpen} onClose={handleCloseAddEstadoCuentaModal} onSave={handleSaveNuevoEstadoCuenta} estructuraId={estructuraId} />
            <EditEstadoCuentaModal isOpen={isEditEstadoCuentaModalOpen} onClose={handleCloseEditEstadoCuentaModal} onUpdate={handleUpdateEstadoCuenta} initialData={estadoCuentaToEdit} />
            <AddPrestamoModal 
                isOpen={isAddPrestamoModalOpen} 
                onClose={() => {
                    closeAddPrestamoModal(); 
                    setExpedienteParaPrestamo(null);
                }} 
                onSavePrestamo={handleSavePrestamoWrapper} 
                expedienteId={expedienteParaPrestamo?.id} 
                expedienteNombre={expedienteParaPrestamo?.nombre} 
            />
            <AddContabilidadModal 
                isOpen={isAddContabilidadModalOpen} 
                onClose={closeAddContabilidadModalHandler} 
                onSave={handleSaveNuevoContabilidadItem} 
                estructuraId={estructuraId}
            />
        </div>
    );
};