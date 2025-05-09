// src/pages/estructuras/detalle/EstructuraDetalle.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { Timestamp } from 'firebase/firestore'; // Ya no es necesario aquí si solo se usa en hooks/modals

// Vistas de Subsección
import { AntecedentesSocietariosView } from './AntecedentesSocietariosView';
import { ExpedientesAsociadosView } from './ExpedientesAsociadosView';
import { EstadosDeCuentaView } from './EstadosDeCuentaView';

// Modales
import { AddAntecedenteModal } from '../../../modals/AddAntecedenteModal';
import { EditAntecedenteModal } from '../../../modals/EditAntecedenteModal';
import { AddDocumentoModal } from '../../../modals/AddDocument';
import { AddEstadoCuentaModal } from '../../../modals/AddEstadoCuentaModal';
import { EditEstadoCuentaModal } from '../../../modals/EditEstadoCuentaModal'; // <-- NUEVO MODAL

// Hooks Personalizados (ajusta rutas según tu estructura)
import { useEstructuraData } from '../../../hooks/useEstructuraData';
import { useAntecedentesLogic } from '../../../hooks/useAntecedentesLogic';
import { useExpedientesLogic } from '../../../hooks/useExpedientesLogic';
import { useEstadosCuentaLogic } from '../../../hooks/useEstadosCuentaLogic';

import './EstructuraDetalle.css';

const formatDate = (timestamp) => {
    // ... (sin cambios)
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
        const parts = timestamp.split('-');
        if (parts.length === 3) {
            date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        } else {
            date = new Date(timestamp);
        }
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return 'Fecha inválida';
    }
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
};


export const EstructuraDetalle = () => {
    const { estructuraId } = useParams();
    const navigate = useNavigate();

    const [activeSubView, setActiveSubView] = useState('antecedentes');

    const { estructura, loadingEstructura, errorEstructura, fetchEstructuraDetalle } = useEstructuraData(estructuraId);

    const {
        antecedentesArray, expandedAntecedenteIndex, isAddAntecedenteModalOpen,
        isEditAntecedenteModalOpen, antecedenteToEdit, handleOpenAddAntecedenteModal,
        handleCloseAddAntecedenteModal, handleSaveAntecedente, handleOpenEditAntecedenteModal,
        handleCloseEditAntecedenteModal, handleUpdateAntecedente, toggleExpandAntecedente,
    } = useAntecedentesLogic(estructura, fetchEstructuraDetalle);

    const {
        expedientes, loadingExpedientes, errorExpedientes, isAddExpedienteModalOpen,
        fetchExpedientes, handleOpenAddExpedienteModal, handleCloseAddExpedienteModal,
        handleSaveNuevoExpediente, handleUpdateExpedienteEnDetalle,
    } = useExpedientesLogic(estructuraId);

    // Obtener las nuevas funciones y estados del hook de Estados de Cuenta
    const {
        estadosCuenta, loadingEstadosCuenta, errorEstadosCuenta,
        fetchEstadosDeCuenta,
        isAddEstadoCuentaModalOpen,
        handleOpenAddEstadoCuentaModal,
        handleCloseAddEstadoCuentaModal,
        handleSaveNuevoEstadoCuenta,
        isEditEstadoCuentaModalOpen, // <-- NUEVO
        estadoCuentaToEdit,         // <-- NUEVO
        handleOpenEditEstadoCuentaModal, // <-- NUEVO
        handleCloseEditEstadoCuentaModal, // <-- NUEVO
        handleUpdateEstadoCuenta,     // <-- NUEVO
    } = useEstadosCuentaLogic(estructuraId);


    useEffect(() => {
        if (activeSubView === 'expedientes' && estructuraId) {
            fetchExpedientes();
        } else if (activeSubView === 'estados_cuenta' && estructuraId) {
            fetchEstadosDeCuenta();
        }
    }, [activeSubView, estructuraId, fetchExpedientes, fetchEstadosDeCuenta]);


    if (loadingEstructura) return <div className="detalle-status-container"><p>Cargando estructura...</p></div>;
    if (errorEstructura) return <div className="detalle-status-container error"><p>{errorEstructura}</p></div>;
    if (!estructura) return <div className="detalle-status-container"><p>No hay datos de la estructura.</p></div>;

    return (
        <div className="estructura-detalle-container">
            {/* ... (Botón Volver y Header sin cambios) ... */}
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
                    Estados de Cuenta
                </button>
            </div>


            {activeSubView === 'antecedentes' && (
                <AntecedentesSocietariosView
                    antecedentes={antecedentesArray}
                    expandedIndex={expandedAntecedenteIndex}
                    onToggleExpand={toggleExpandAntecedente}
                    onOpenAddModal={handleOpenAddAntecedenteModal}
                    onOpenEditModal={handleOpenEditAntecedenteModal} // Asegúrate que esta se llame en AntecedentesSocietariosView
                    formatDate={formatDate}
                />
            )}
            {activeSubView === 'expedientes' && (
                <ExpedientesAsociadosView
                    estructuraId={estructuraId}
                    estructuraNombre={estructura?.RazonSocial || `Estructura ${estructuraId}`}
                    expedientes={expedientes}
                    loading={loadingExpedientes}
                    error={errorExpedientes}
                    onOpenAddModal={handleOpenAddExpedienteModal}
                    onUpdateExpediente={handleUpdateExpedienteEnDetalle}
                    formatDate={formatDate}
                />
            )}
            {activeSubView === 'estados_cuenta' && (
                <EstadosDeCuentaView
                    estructuraId={estructuraId}
                    estructuraNombre={estructura?.RazonSocial || `Estructura ${estructuraId}`}
                    estadosCuenta={estadosCuenta}
                    loading={loadingEstadosCuenta}
                    error={errorEstadosCuenta}
                    formatDate={formatDate}
                    onOpenAddModal={handleOpenAddEstadoCuentaModal}
                    onOpenEditModal={handleOpenEditEstadoCuentaModal} // <-- PASAR NUEVA PROP
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
            <AddDocumentoModal // Para Expedientes
                isOpen={isAddExpedienteModalOpen}
                onClose={handleCloseAddExpedienteModal}
                onSave={handleSaveNuevoExpediente}
                estructuraId={estructuraId}
            />
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
                initialData={estadoCuentaToEdit} // estadoCuentaToEdit ya tiene la data y el id
            />
        </div>
    );
};