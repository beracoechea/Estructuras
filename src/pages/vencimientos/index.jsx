// src/components/vencimientos/VencimientosView.jsx
import React, { useState } from 'react';
// Asumo que el hook y formatDateForVencimientos están en esta ruta relativa a este archivo.
// Si están en `src/hooks/`, la ruta sería: ../../hooks/useVencimientosData
import { useVencimientosData, formatDateForVencimientos } from '../../hooks/useVencimientosData';
import { EditExpedienteModal } from '../../modals/EditExpedienteModal'; // Ajusta si la ruta es diferente
import './VencimientosView.css';

export const VencimientosView = ({ userInfo }) => {
  const { expedientesConVencimiento, loading, error, refetchData, updateExpedienteEnLista } = useVencimientosData();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expedienteToEdit, setExpedienteToEdit] = useState(null);

  const handleOpenEditModal = (expediente) => {
    setExpedienteToEdit(expediente);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setExpedienteToEdit(null);
  };

  const handleUpdateExpedienteDesdeModal = async (idExpediente, datosActualizados) => {
    try {
      // El idExpediente que viene del modal puede ser el 'id' (nombre) o un ID numérico si lo tienes.
      // updateExpedienteEnLista espera el 'id' del expediente (nombre) y el 'idOriginalDocEstructura' (estructuraId)
      // Asegúrate de que expedienteToEdit contenga el 'idOriginalDocEstructura'
      if (!expedienteToEdit || !expedienteToEdit.idOriginalDocEstructura) {
          console.error("Falta idOriginalDocEstructura en expedienteToEdit para la actualización.");
          alert("Error: Información incompleta para actualizar el expediente.");
          return false;
      }
      // El 'idExpediente' que pasamos a updateExpedienteEnLista es el 'id' del objeto expediente (que es su nombre)
      await updateExpedienteEnLista(idExpediente, datosActualizados, expedienteToEdit.idOriginalDocEstructura);
      handleCloseEditModal();
      await refetchData();
      alert('Expediente actualizado correctamente.');
      return true;
    } catch (updateError) {
      console.error("Error al actualizar expediente desde VencimientosView:", updateError);
      alert(`Error al actualizar el expediente: ${updateError.message}`);
      return false;
    }
  };

  if (loading) return <div className="status-container"><p>Cargando vencimientos...</p></div>;
  if (error) return <div className="status-container error"><p>{error} <button onClick={refetchData} className="button-retry">Reintentar</button></p></div>;

  const hoy = new Date(); // Miércoles, 14 de mayo de 2025
  hoy.setHours(0, 0, 0, 0);

  const expedientesVencidos = [];
  const expedientesHoy = [];
  const expedientesProximos7Dias = [];
  const expedientesProximos8a30Dias = [];
  const expedientesProximos31a90Dias = []; // Nueva categoría
  const expedientesProximos91a180Dias = []; // Nueva categoría

  expedientesConVencimiento.forEach(exp => {
    if (!exp.fechaVencimiento || !exp.fechaVencimiento.toDate) {
      console.warn("Expediente sin fecha de vencimiento válida o no es Timestamp:", exp.id, exp.fechaVencimiento);
      return;
    }
    const fechaVenc = exp.fechaVencimiento.toDate();
    fechaVenc.setHours(0, 0, 0, 0);
    const diffTime = fechaVenc.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expedientesVencidos.push(exp);
    } else if (diffDays === 0) {
      expedientesHoy.push(exp);
    } else if (diffDays <= 7) {
      expedientesProximos7Dias.push(exp);
    } else if (diffDays <= 30) {
      expedientesProximos8a30Dias.push(exp);
    } else if (diffDays <= 90) { // Nuevo rango
      expedientesProximos31a90Dias.push(exp);
    } else if (diffDays <= 180) { // Nuevo rango
      expedientesProximos91a180Dias.push(exp);
    }
    // Los que vencen después de 180 días no se añaden a ninguna de estas listas
  });

  const renderExpedienteList = (list, title, listClassName = '') => {
    // ... (la función renderExpedienteList permanece igual que antes)
    if (!list || list.length === 0) {
      return (
        <div className={`vencimiento-category ${listClassName}`}>
          <h3>{title} (0)</h3>
          <p className="no-expedientes">No hay expedientes en esta categoría.</p>
        </div>
      );
    }
    return (
      <div className={`vencimiento-category ${listClassName}`}>
        <h3>{title} ({list.length})</h3>
        <ul className="expediente-list">
          {list.map(exp => (
            <li
              key={exp.id} // Asumiendo que exp.id es el nombre del expediente o un id único dentro del array
              className="expediente-item"
              onClick={() => handleOpenEditModal(exp)}
              title={`Editar ${exp.nombre} de ${exp.nombreEstructura}`}
            >
              <span className="expediente-nombre">{exp.nombre}</span>
              <span className="estructura-nombre">({exp.nombreEstructura})</span>
              <span className="fecha-vencimiento">
                Vence: {formatDateForVencimientos(exp.fechaVencimiento)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };


  return (
    <div className="vencimientos-view-container">
      <div className="vencimientos-header">
        <h1>Control de Vencimientos de Expedientes (Hasta 6 Meses)</h1>
        <button onClick={refetchData} className="button-refresh" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar Lista'}
        </button>
      </div>

      {expedientesConVencimiento.length === 0 && !loading && (
        <p className="no-expedientes-general">No se encontraron expedientes con fechas de vencimiento registradas.</p>
      )}

      {renderExpedienteList(expedientesVencidos, "Vencidos", "categoria-vencidos")}
      {renderExpedienteList(expedientesHoy, "Vencen Hoy", "categoria-hoy")}
      {renderExpedienteList(expedientesProximos7Dias, "Próximos 1-7 Días", "categoria-proximos7")}
      {renderExpedienteList(expedientesProximos8a30Dias, "Próximos 8-30 Días", "categoria-proximos30")}
      {renderExpedienteList(expedientesProximos31a90Dias, "Próximos 31-90 Días", "categoria-proximos90")} {/* Nueva clase CSS */}
      {renderExpedienteList(expedientesProximos91a180Dias, "Próximos 91-180 Días", "categoria-proximos180")} {/* Nueva clase CSS */}

      {expedienteToEdit && (
        <EditExpedienteModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onUpdateExpediente={handleUpdateExpedienteDesdeModal}
          initialData={expedienteToEdit}
          // Asegúrate que `EditExpedienteModal` pueda manejar la estructura de `expedienteToEdit`
          // que ahora viene del array y tiene `idOriginalDocEstructura`
        />
      )}
    </div>
  );
};