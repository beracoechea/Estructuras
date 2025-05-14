// src/components/EstadosDeCuentaView.jsx
import React, { useState, useEffect } from 'react';
import './EstadosCuenta.css';

const MESES_CONFIG_CHECKS = [
    { id: 'ENE', label: 'Enero' }, { id: 'FEB', label: 'Febrero' },
    { id: 'MAR', label: 'Marzo' }, { id: 'ABR', label: 'Abril' },
    { id: 'MAY', label: 'Mayo' }, { id: 'JUN', label: 'Junio' },
    { id: 'JUL', label: 'Julio' }, { id: 'AGO', label: 'Agosto' },
    { id: 'SEP', label: 'Septiembre' }, { id: 'OCT', label: 'Octubre' },
    { id: 'NOV', label: 'Noviembre' }, { id: 'DIC', label: 'Diciembre' }
];

const getUiChecksData = (backendDataArray) => {
    return MESES_CONFIG_CHECKS.map(mesConfig => {
        // El backendDataArray es el array de registrosMeses
        const dataMes = backendDataArray?.find(d => d.mesId === mesConfig.id); // Asegúrate que el campo sea mesId
        return {
            ...mesConfig,
            marcado: dataMes?.marcado || false,
            observacion: dataMes?.observacion || ''
        };
    });
};

export const EstadosDeCuentaView = ({
    // Props para la lista de Cuentas Bancarias
    // Asumimos que `estadosCuenta` ahora es una lista de documentos de cuentas bancarias
    // Cada `cb` (cuenta bancaria) tendrá: id, nombreBanco, cuentaClabe, fechaApertura, fechaRegistroDoc
    estadosCuenta, // Anteriormente podría haber sido para estados de cuenta mensuales
    loading,
    error,
    onOpenAddModal, // Para añadir una nueva Cuenta Bancaria
    onOpenEditModal, // Para editar una Cuenta Bancaria existente `onOpenEditModal(cb)`
    formatDate,

    // Props para la sección de Checks de Control Mensual
    estructuraId,
    initialAnoChecks = new Date().getFullYear(),
    checksDataForYear, // Este es el array de objetos {mesId, marcado, observacion}
    loadingChecks,
    errorChecks,
    onAnoChecksChange,
    onUpdateChecksData, // (ano, mesId, { marcado, observacion }) => Promise<void>
    onInitializeYearlyChecks, // Opcional: (ano) => Promise<void>
}) => {
    const [anoChecksSeleccionado, setAnoChecksSeleccionado] = useState(initialAnoChecks);
    const [uiChecks, setUiChecks] = useState(() => getUiChecksData(checksDataForYear));
    const [savingStates, setSavingStates] = useState({});

    useEffect(() => {
        setUiChecks(getUiChecksData(checksDataForYear));
    }, [checksDataForYear]);

    useEffect(() => {
        // Solo llamar si la función existe y el año ha cambiado efectivamente
        if (onAnoChecksChange && anoChecksSeleccionado !== initialAnoChecks) {
            onAnoChecksChange(anoChecksSeleccionado);
        } else if (onAnoChecksChange && anoChecksSeleccionado === initialAnoChecks && !checksDataForYear) {
             // Cargar datos para el año inicial si aún no se han cargado
            onAnoChecksChange(initialAnoChecks);
        }
    }, [anoChecksSeleccionado, onAnoChecksChange, initialAnoChecks, checksDataForYear]);


    const handleAnoChecksInputChange = (e) => {
        const nuevoAno = parseInt(e.target.value);
        if (!isNaN(nuevoAno)) {
            setAnoChecksSeleccionado(nuevoAno);
        }
    };

    const handleCheckChange = async (mesId, nuevoEstadoMarcado) => {
        // Optimistic UI update
        const tempUiChecks = uiChecks.map(mes =>
            mes.id === mesId ? { ...mes, marcado: nuevoEstadoMarcado } : mes
        );
        setUiChecks(tempUiChecks);

        if (onUpdateChecksData) {
            const mesAfectado = tempUiChecks.find(m => m.id === mesId);
            setSavingStates(prev => ({ ...prev, [mesId]: true }));
            try {
                await onUpdateChecksData(anoChecksSeleccionado, mesId, {
                    marcado: nuevoEstadoMarcado,
                    observacion: mesAfectado?.observacion || ''
                });
            } catch (err) {
                console.error(`Error al actualizar check para ${mesId} ${anoChecksSeleccionado}:`, err);
                setUiChecks(getUiChecksData(checksDataForYear)); // Revertir a datos conocidos
            } finally {
                setSavingStates(prev => ({ ...prev, [mesId]: false }));
            }
        }
    };

    const handleObservacionChange = (mesId, nuevaObservacion) => {
        setUiChecks(prev => prev.map(mes =>
            mes.id === mesId ? { ...mes, observacion: nuevaObservacion } : mes
        ));
    };

    const handleObservacionBlur = async (mesId) => {
        if (onUpdateChecksData) {
            const mesAfectadoUi = uiChecks.find(m => m.id === mesId);
            const mesOriginalBackend = checksDataForYear?.find(d => d.mesId === mesId);

            // Solo guardar si la observación realmente cambió o si el mes es nuevo
            if (mesAfectadoUi && (mesOriginalBackend?.observacion !== mesAfectadoUi.observacion || !mesOriginalBackend)) {
                setSavingStates(prev => ({ ...prev, [mesId]: true }));
                try {
                    await onUpdateChecksData(anoChecksSeleccionado, mesId, {
                        marcado: mesAfectadoUi.marcado,
                        observacion: mesAfectadoUi.observacion
                    });
                } catch (err) {
                    console.error(`Error al actualizar observación para ${mesId} ${anoChecksSeleccionado}:`, err);
                } finally {
                    setSavingStates(prev => ({ ...prev, [mesId]: false }));
                }
            }
        }
    };

    if (loading) return <div className="status-container"><p>Cargando Cuentas Bancarias...</p></div>;
    if (error) return <div className="status-container error"><p>Error al cargar Cuentas Bancarias: {error}</p></div>;

    return (
        <div className="main-container-estados-cuenta">
            <div className="detalle-seccion estados-cuenta-view">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Cuentas Bancarias Registradas</h2>
                    {onOpenAddModal && (
                         <button className="button-add-new" onClick={onOpenAddModal}>
                            + Añadir Cuenta Bancaria
                        </button>
                    )}
                </div>

                {!estadosCuenta || estadosCuenta.length === 0 ? (
                    <p>No hay cuentas bancarias registradas para esta estructura.</p>
                ) : (
                    <div className="estados-cuenta-list-cards">
                        {estadosCuenta.map((cb) => ( // cb para cuenta bancaria
                            <div key={cb.id} className="estado-cuenta-card"> {/* Reutilizamos clase */}
                                <div className="ec-card-header">
                                    <h3>{cb.nombreBanco || 'N/A'}</h3>
                                    {/* El estatus no parece aplicar a la cuenta en sí, sino a un estado de cuenta mensual */}
                                </div>
                                <div className="ec-card-body">
                                    <p><strong>CLABE:</strong> {cb.cuentaClabe || 'N/A'}</p>
                                    <p><strong>Fecha Apertura:</strong> {cb.fechaApertura ? formatDate(cb.fechaApertura) : 'N/A'}</p>
                                    {/* Otros campos de la cuenta bancaria si los tienes */}
                                </div>
                                <div className="ec-card-footer">
                                    <small>Registrada: {cb.fechaRegistroDoc ? formatDate(cb.fechaRegistroDoc) : 'N/A'}</small>
                                    {onOpenEditModal && (
                                        <button
                                            className="button-edit-antecedente"
                                            onClick={() => onOpenEditModal(cb)}
                                        >
                                            Editar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <hr style={{ margin: '40px 0', border: '1px solid #ccc' }} />

           <div className="detalle-seccion control-mensual-checks-view">
                <div className="control-mensual__header"> {/* Contenedor del encabezado de esta sección */}
                    <h2 className="control-mensual__title">Control Mensual de Conciliación</h2>
                    <div className="control-mensual__year-selector"> {/* Grupo para el selector de año */}
                    <label htmlFor="ano-checks-input" className="year-selector__label">Año:</label>
                    <input
                        type="number"
                        id="ano-checks-input"
                        value={anoChecksSeleccionado} // Estas props vienen de React
                        onChange={handleAnoChecksInputChange} // Estas props vienen de React
                        placeholder="YYYY"
                        min="1980"
                        max={new Date().getFullYear() + 5}
                        className="year-selector__input" // Clase más específica para el input de año
                    />
                    </div>
                </div>

                {loadingChecks && <div className="status-container"><p>Cargando control de checks para {anoChecksSeleccionado}...</p></div>}
                {errorChecks && <div className="status-container error"><p>Error al cargar datos de checks: {typeof errorChecks === 'string' ? errorChecks : errorChecks.message}</p></div>}

                {!loadingChecks && !errorChecks && !estructuraId && <p>Se requiere un ID de estructura para el control mensual.</p>}
                {!loadingChecks && !errorChecks && estructuraId && (!checksDataForYear && onInitializeYearlyChecks) && (
                     <div className="status-container">
                        <p>No se ha iniciado el control para el año {anoChecksSeleccionado}.</p>
                        <button onClick={() => onInitializeYearlyChecks(anoChecksSeleccionado)} className="button-add-new" style={{backgroundColor: '#28a745'}}>
                            Iniciar Control para {anoChecksSeleccionado}
                        </button>
                    </div>
                )}

                {!loadingChecks && !errorChecks && estructuraId && checksDataForYear && (
                    <div className="checks-mensuales-grid">
                        {uiChecks.map(mes => (
                            <div key={mes.id} className="check-mensual-item">
                                <div className="check-mensual-header">
                                    <input
                                        type="checkbox"
                                        id={`check-${mes.id}-${anoChecksSeleccionado}`}
                                        checked={mes.marcado}
                                        onChange={(e) => handleCheckChange(mes.id, e.target.checked)}
                                        disabled={savingStates[mes.id]}
                                    />
                                    <label htmlFor={`check-${mes.id}-${anoChecksSeleccionado}`} style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                                        {mes.label}
                                    </label>
                                    {savingStates[mes.id] && <small style={{marginLeft: '10px', fontStyle: 'italic'}}> Guardando...</small>}
                                </div>
                                <textarea
                                    id={`obs-${mes.id}-${anoChecksSeleccionado}`}
                                    value={mes.observacion}
                                    onChange={(e) => handleObservacionChange(mes.id, e.target.value)}
                                    onBlur={() => handleObservacionBlur(mes.id)}
                                    placeholder="Observaciones del mes..."
                                    rows="2"
                                    className="comentario-link-textarea"
                                    disabled={savingStates[mes.id]}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};