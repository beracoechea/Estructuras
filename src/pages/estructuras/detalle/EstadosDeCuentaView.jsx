// src/pages/estructuras/detalle/EstadosDeCuentaView.jsx
import React from 'react';

// Asumimos que formatDate se pasa como prop o se define aquí
// const formatDateLocal = (timestamp) => { /* ... tu función ... */ };

export const EstadosDeCuentaView = ({
    estadosCuenta,
    loading,
    error,
    // estructuraNombre, // No se usa actualmente, pero podría ser útil
    onOpenAddModal,
    onOpenEditModal, // <-- NUEVA PROP
    formatDate
}) => {
    // const displayDate = formatDate || formatDateLocal;
    // Usaremos formatDate directamente ya que es obligatorio

    if (loading) return <div className="status-container"><p>Cargando estados de cuenta...</p></div>;
    if (error) return <div className="status-container error"><p>{error}</p></div>;

    return (
        <div className="detalle-seccion estados-cuenta-view">
            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <button className="button-add-new" onClick={onOpenAddModal}>
                    + Añadir Estado de Cuenta
                </button>
            </div>

            {estadosCuenta.length === 0 ? (
                <p>No hay estados de cuenta registrados para esta estructura.</p>
            ) : (
                <div className="estados-cuenta-list-cards">
                    {estadosCuenta.map((ec) => ( // No se necesita el índice si 'ec.id' es único
                        <div key={ec.id} className="estado-cuenta-card">
                            <div className="ec-card-header">
                                <h3>{ec.banco || 'N/A'} - {ec.mes || 'N/A'} {ec.ano || 'N/A'}</h3>
                                <span className={`ec-status ec-status-${(ec.estatus || 'default').toLowerCase().replace(/\s+/g, '-')}`}>{ec.estatus || 'Sin Estatus'}</span>
                            </div>
                            <div className="ec-card-body">
                                <p><strong># Cuenta:</strong> {ec.numeroCuenta || 'N/A'}</p>
                                <p><strong>CLABE:</strong> {ec.clabe || 'N/A'}</p>
                                <p><strong>ID Objeto:</strong> {ec.idObjeto || 'N/A'}</p>
                                {ec.linkAcceso && ( // Cambiado desde linkDocumento para coincidir con el modal
                                    <p><strong>Link:</strong> <a href={ec.linkAcceso} target="_blank" rel="noopener noreferrer" className="link-acceso">Ver Documento</a></p>
                                )}
                                <p><strong>Ubic. Física:</strong> {ec.ubicacionFisica || 'N/A'}</p>
                                {ec.actualizacionesDomicilio && <div className="text-area-display"><strong>Act. Domicilio:</strong><pre>{ec.actualizacionesDomicilio}</pre></div>}
                                {ec.observaciones && <div className="text-area-display"><strong>Observaciones:</strong><pre>{ec.observaciones}</pre></div>}
                            </div>
                            <div className="ec-card-footer">
                                <small>Registrado: {formatDate(ec.fechaRegistro)}</small>
                                {ec.fechaActualizacion && <small style={{ marginLeft: '10px' }}>Actualizado: {formatDate(ec.fechaActualizacion)}</small>}
                                {/* --- BOTÓN DE EDITAR --- */}
                                <button
                                    className="button-edit-antecedente"
                                    onClick={() => onOpenEditModal(ec)} 
                                >
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};