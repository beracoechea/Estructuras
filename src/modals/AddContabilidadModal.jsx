// src/modals/AddContabilidadModal.jsx
import React, { useState } from 'react';
import './Modal.css';

export const AddContabilidadModal = ({ isOpen, onClose, onSave, estructuraId }) => {
  const [formData, setFormData] = useState({
    tipo: '',
    periodo: '',
    fechaPresentacion: '',
    estado: 'pendiente',
    observaciones: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error al guardar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Añadir Nuevo Registro Contable</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo:</label>
            <select 
              name="tipo" 
              value={formData.tipo} 
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar tipo</option>
              <option value="iva">IVA</option>
              <option value="isr">ISR</option>
              <option value="diot">DIOT</option>
              <option value="contabilidad">Contabilidad</option>
              <option value="nomina">Nómina</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Período:</label>
            <input
              type="month"
              name="periodo"
              value={formData.periodo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Fecha de Presentación:</label>
            <input
              type="date"
              name="fechaPresentacion"
              value={formData.fechaPresentacion}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Estado:</label>
            <select 
              name="estado" 
              value={formData.estado} 
              onChange={handleChange}
            >
              <option value="pendiente">Pendiente</option>
              <option value="presentado">Presentado</option>
              <option value="atrasado">Atrasado</option>
              <option value="no_aplica">No aplica</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Observaciones:</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};