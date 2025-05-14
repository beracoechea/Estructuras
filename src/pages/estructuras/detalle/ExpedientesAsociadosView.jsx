// src/pages/estructuras/detalle/ExpedientesAsociadosView.jsx
import React, { useState } from 'react';
import { EditExpedienteModal } from '../../../modals/EditExpedienteModal';

export const ExpedientesAsociadosView = ({
  expedientes, // Esta prop contendrá los expedientes, incluyendo los predeterminados una vez cargados
  loading,     // Esta prop ya combina 'loadingExpedientes' y 'isCreatingDefaults' desde el padre
  error,
  onUpdateExpediente, // Para editar los expedientes existentes (predeterminados o ya detallados)
  formatDate,
  estructuraNombre,
  estructuraId, // Puede ser útil para el contexto o para pasar al EditExpedienteModal si lo necesita
  onOpenPrestamoModal,
  // highlightedExpedienteId, // Estaba comentado en tu código, lo mantengo así
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expedienteToEdit, setExpedienteToEdit] = useState(null);
  const [expandedExpedienteId, setExpandedExpedienteId] = useState(null);

  const handleOpenEditModal = (expedienteData) => {
    setExpedienteToEdit(expedienteData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setExpedienteToEdit(null);
  };

  const toggleExpandExpediente = (expedienteId) => {
    setExpandedExpedienteId(prevId => (prevId === expedienteId ? null : expedienteId));
  };

  // El mensaje de carga se maneja primero
  if (loading) return <div className="status-container"><p>Cargando expedientes...</p></div>;
  // Luego el mensaje de error
  if (error) return <div className="status-container error"><p>{error}</p></div>;

  const getSafeDateFromTimestamp = (firestoreTimestamp) => {
    if (firestoreTimestamp && typeof firestoreTimestamp.toDate === 'function') {
      return firestoreTimestamp.toDate();
    }
    return null;
  };

  // La lógica de ordenamiento actual por fecha de vencimiento se mantiene.
  // Si se requiere un orden predefinido fijo, se necesitaría un campo 'orden'
  // en el modelo de datos de Expediente y ajustar este sort.
  const sortedExpedientes = [...expedientes].sort((a, b) => {
    const now = new Date().setHours(0, 0, 0, 0);
    const dateA = getSafeDateFromTimestamp(a.fechaVencimiento);
    const timeA = dateA ? dateA.getTime() : null;
    const aIsPast = timeA ? timeA < now : false;
    const dateB = getSafeDateFromTimestamp(b.fechaVencimiento);
    const timeB = dateB ? dateB.getTime() : null;
    const bIsPast = timeB ? timeB < now : false;

    if (!timeA && !timeB) return 0;
    if (!timeA) return 1; // expedientes sin fecha de vencimiento van al final
    if (!timeB) return -1; // expedientes sin fecha de vencimiento van al final

    if (!aIsPast && bIsPast) return -1; // 'a' no ha vencido, 'b' sí -> 'a' primero
    if (aIsPast && !bIsPast) return 1;  // 'a' venció, 'b' no -> 'b' primero

    return timeA - timeB; // ordenar por fecha de vencimiento ascendente
  });

  return (
    <div className="detalle-seccion expedientes-asociados">
      <div className="expedientes-list-header">
        <h2>Expedientes Asociados</h2>
      </div>

      {/* Si no hay error y no está cargando, pero no hay expedientes */}
      {/* Este mensaje es importante para guiar al usuario */}
      {!loading && !error && sortedExpedientes.length === 0 && (
        <div className="status-container no-data">
          <p>
            No hay expedientes cargados para esta estructura.
            Puede utilizar el botón "Cargar Expedientes Predeterminados"
            (ubicado arriba de esta sección) para añadirlos.
          </p>
        </div>
      )}

      {/* Si no hay error, no está cargando, y hay expedientes, se muestran */}
      {!loading && !error && sortedExpedientes.length > 0 && (
        <div className="antecedentes-cards-container">
          {sortedExpedientes.map((exp) => {
            const isExpanded = expandedExpedienteId === exp.id;
            const hoy = new Date();
            const fechaVenc = getSafeDateFromTimestamp(exp.fechaVencimiento);
            let vencimientoClass = '';
            let vencimientoText = exp.fechaVencimiento ? formatDate(exp.fechaVencimiento) : 'N/A'; // Usar exp.fechaVencimiento para formatDate

            if (fechaVenc) {
              const diffTime = fechaVenc.getTime() - hoy.getTime(); // Asegurar que 'hoy' no tenga horas/minutos si fechaVenc es solo fecha
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffTime < 0 && fechaVenc.setHours(0,0,0,0) < hoy.setHours(0,0,0,0)) { // Comparar solo fechas
                vencimientoClass = 'vencido';
                vencimientoText += ` (Venció hace ${Math.abs(diffDays)} días)`;
              } else if (fechaVenc.setHours(0,0,0,0) === hoy.setHours(0,0,0,0)) { // Vence exactamente hoy
                vencimientoClass = 'vence-hoy';
                vencimientoText += " (Vence hoy)";
              } else if (diffDays > 0 && diffDays <= 30) { // Vence en los próximos 30 días
                vencimientoClass = 'vence-pronto';
                vencimientoText += ` (Vence en ${diffDays} días)`;
              }
            } else {
              vencimientoText = 'N/A'; // Si no hay fechaVencimiento válida
            }

            return (
              <div key={exp.id} className={`antecedente-card ${isExpanded ? 'expanded' : ''} ${vencimientoClass}`}>
                <div className="antecedente-summary" onClick={() => toggleExpandExpediente(exp.id)}>
                  <div className="summary-info">
                    <span className="summary-field"><strong>Nombre:</strong> {exp.nombre || 'N/A'}</span>
                    <span className="summary-field"><strong>Número:</strong> {exp.numero || 'N/A'}</span>
                    <span className="summary-field"><strong>Fecha Doc.:</strong> {exp.fecha ? formatDate(exp.fecha) : 'N/A'}</span>
                    <span className="summary-field"><strong>Estatus:</strong> {exp.estatus || 'Pendiente'}</span>
                    {exp.fechaVencimiento && (
                      <span className={`summary-field vencimiento-info ${vencimientoClass}`}>
                        <strong>Vence:</strong> {formatDate(exp.fechaVencimiento)} {/* formatDate debería manejar Timestamps o strings */}
                      </span>
                    )}
                  </div>
                  <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
                </div>
                <div className="antecedente-details">
                  <p><strong>Link Digital:</strong> {exp.linkDigital ? <a href={exp.linkDigital} target="_blank" rel="noopener noreferrer" className="link-acceso" onClick={e => e.stopPropagation()}>Ver</a> : 'N/A'}</p>
                  <p><strong>Ubicación Física:</strong> {exp.ubicacionFisica || 'N/A'}</p>
                  <div className="text-area-display"><strong>Observaciones:</strong><pre>{exp.observaciones || 'N/A'}</pre></div>
                  <p><strong>Original (Cant.):</strong> {exp.original != null ? exp.original : 'N/A'}</p>
                  <p><strong>Copias Cert. (Cant.):</strong> {exp.copiasCertificadas != null ? exp.copiasCertificadas : 'N/A'}</p>
                  <p className={vencimientoClass}>
                    <strong>Fecha de Vencimiento:</strong> {vencimientoText}
                  </p>
                  <p><strong>Fecha Registro:</strong> {exp.fechaRegistro ? formatDate(exp.fechaRegistro) : 'N/A'}</p>
                  {exp.fechaActualizacion && <p><strong>Últ. Actualización:</strong> {formatDate(exp.fechaActualizacion)}</p>}

                  <div className="antecedente-actions">
                    <button
                      className="button-edit-antecedente"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(exp);
                      }}
                    >
                      Editar Expediente
                    </button>
                    <button
                      className="button-prestamo"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPrestamoModal(exp);
                      }}
                    >
                      Registrar Préstamo
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditExpedienteModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdateExpediente={onUpdateExpediente}
        initialData={expedienteToEdit}
        // estructuraId={estructuraId} // Pasar estructuraId si el modal lo necesita
      />
    </div>
  );
};