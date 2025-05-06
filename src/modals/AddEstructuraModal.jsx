// src/modals/AddEstructuraModal.jsx
import React, { useState } from 'react';
import './Modal.css'; // Asegúrate que este CSS exista y esté bien estilizado

export const AddEstructuraModal = ({ isOpen, onClose, onSave }) => {
    // --- Estados para los campos del formulario ---
    const [razonSocial, setRazonSocial] = useState('');
    const [tipo, setTipo] = useState(''); // Valor inicial vacío para el select
    const [estatus, setEstatus] = useState(''); // Valor inicial vacío para el select
    const [uso, setUso] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // --- Estado para control y errores ---
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // --- Opciones para los select/pickers ---
    // Puedes obtener estas opciones desde una constante, config, o incluso una API si son dinámicas
    const opcionesTipo = [
        { value: "Sociedad civil", label: "Sociedad civil" },
        { value: "Asociación patronal", label: "Asociación patronal" },
        { value: "Sindicato", label: "Sindicato" },
        { value: "Confederacion", label: "Confederacion" },
        { value: "SOFOM", label: "SOFOM" },
        { value: "Otro", label: "Otro" },
    ];

    const opcionesEstatus = [
        { value: "Operando normal", label: "Operando normal" },
        { value: "Sin operación", label: "Sin operación" },
        { value: "Con proceso fiscal - sin operación.", label: "Con proceso fiscal - sin operación." },
        { value: "Con sellos restringidos sin proceso fiscal.", label: "Con sellos restringidos sin proceso fiscal." },
        { value: "Sellos restringidos con proceso fiscal.", label: "Sellos restringidos con proceso fiscal." },
        { value: "Otro", label: "Otro" },

    ];


    // --- Función para limpiar el formulario ---
    const resetForm = () => {
        setRazonSocial('');
        setTipo(''); // Resetea a valor inicial del select
        setEstatus(''); // Resetea a valor inicial del select
        setUso('');
        setObservaciones('');
        setError('');
    };

    // --- Manejador para cerrar (también limpia el form) ---
    const handleClose = () => {
        resetForm();
        onClose();
    };

    // --- Manejador del envío del formulario ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!razonSocial.trim()) {
            setError('El campo "Razón Social" es obligatorio.');
            return;
        }
        // Validación opcional para los select:
        if (!tipo) {
            setError('Debe seleccionar un "Tipo".');
            return;
        }
        if (!estatus) {
            setError('Debe seleccionar un "Estatus".');
            return;
        }

        setIsSaving(true);
        try {
            const nuevaEstructura = {
                RazonSocial: razonSocial.trim(),
                Tipo: tipo, // Ya es un string del select, trim no es tan crucial pero no daña
                Estatus: estatus, // Igual para estatus
                Uso: uso.trim(),
                Observaciones: observaciones.trim(),
                fechaCreacion: new Date()
            };

            await onSave(nuevaEstructura);
            resetForm();
            // onClose(); // El componente padre (EstructuraEdicion) ya cierra el modal a través de su propio closeModal
        } catch (err) {
            console.error("Error al guardar estructura:", err);
            setError(err.message || "No se pudo guardar la estructura. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Añadir Nueva Estructura</h2>
                <form onSubmit={handleSubmit}>
                    {/* Campo Razón Social */}
                    <div className="form-group">
                        <label htmlFor="add-razonSocial">Razón Social (*):</label>
                        <input
                            type="text"
                            id="add-razonSocial"
                            value={razonSocial}
                            onChange={(e) => setRazonSocial(e.target.value)}
                            disabled={isSaving}
                            autoFocus
                        />
                    </div>

                    {/* Campo Tipo - Ahora es un Select Picker */}
                    <div className="form-group">
                        <label htmlFor="add-tipo">Tipo (*):</label>
                        <select
                            id="add-tipo"
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            disabled={isSaving}
                        >
                            <option value="" disabled>-- Seleccione un Tipo --</option>
                            {opcionesTipo.map(opcion => (
                                <option key={opcion.value} value={opcion.value}>
                                    {opcion.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Campo Estatus - Ahora es un Select Picker */}
                    <div className="form-group">
                        <label htmlFor="add-estatus">Estatus (*):</label>
                        <select
                            id="add-estatus"
                            value={estatus}
                            onChange={(e) => setEstatus(e.target.value)}
                            disabled={isSaving}
                        >
                            <option value="" disabled>-- Seleccione un Estatus --</option>
                            {opcionesEstatus.map(opcion => (
                                <option key={opcion.value} value={opcion.value}>
                                    {opcion.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Campo Uso */}
                    <div className="form-group">
                        <label htmlFor="add-uso">Uso:</label>
                        <input
                            type="text"
                            id="add-uso"
                            value={uso}
                            onChange={(e) => setUso(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>

                    {/* Campo Observaciones */}
                    <div className="form-group">
                        <label htmlFor="add-observaciones">Observaciones:</label>
                        <textarea
                            id="add-observaciones"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            disabled={isSaving}
                            rows="3"
                        />
                    </div>

                    {error && <p className="modal-error">{error}</p>}

                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar Estructura'}
                        </button>
                        <button type="button" className="button-cancel" onClick={handleClose} disabled={isSaving}>
                            Cancelar
                        </button>
                    </div>
                </form>
                <button className="modal-close-button" onClick={handleClose} disabled={isSaving} aria-label="Cerrar modal">&times;</button>
            </div>
        </div>
    );
};