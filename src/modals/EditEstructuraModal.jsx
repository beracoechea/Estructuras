// src/modals/EditEstructuraModal.jsx
import React, { useState, useEffect } from 'react';
import './Modal.css'; // Usar los mismos estilos de modal

export const EditEstructuraModal = ({ isOpen, onClose, onUpdate, initialData }) => {
    // --- Estados para los campos del formulario, inicializados vacíos ---
    const [razonSocial, setRazonSocial] = useState('');
    const [tipo, setTipo] = useState('');
    const [estatus, setEstatus] = useState('');
    const [uso, setUso] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // --- Estado para control y errores ---
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // --- Opciones para los select/pickers (igual que en AddEstructuraModal) ---
    const opcionesTipo = [
        { value: "Sociedad civil", label: "Sociedad civil" },
        { value: "Asociación patronal", label: "Asociación patronal" },
        { value: "Sindicato", label: "Sindicato" },
        { value: "Confederaciones", label: "Confederaciones" },
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

    // --- Función interna para resetear el formulario (útil si no se cierra el modal) ---
    // Aunque en este flujo, el cierre y reapertura con nuevos initialData maneja esto.
    const resetFormLocal = () => {
        setRazonSocial('');
        setTipo('');
        setEstatus('');
        setUso('');
        setObservaciones('');
        setError('');
    };


    // --- Efecto para cargar datos cuando el modal se abre o initialData cambia ---
    useEffect(() => {
        if (isOpen && initialData) {
            // Asegúrate que los nombres de campo coincidan con tu objeto initialData
            // (ej. initialData.RazonSocial vs initialData.razonSocial)
            setRazonSocial(initialData.RazonSocial || '');
            setTipo(initialData.Tipo || '');
            setEstatus(initialData.Estatus || '');
            setUso(initialData.Uso || '');
            setObservaciones(initialData.Observaciones || '');
            setError(''); // Limpiar errores previos al cargar nuevos datos
        } else if (!isOpen) {
            // Opcional: resetear el formulario cuando el modal se cierra,
            // si no se maneja ya por la lógica del componente padre al cambiar initialData a null.
            // resetFormLocal();
        }
    }, [initialData, isOpen]); // Se ejecuta si cambia la data o el estado de apertura

    // --- Manejador del envío del formulario ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!initialData || !initialData.id) {
            setError("Error: No se pudo identificar la estructura a editar.");
            return;
        }
        if (!razonSocial.trim()) {
            setError('El campo "Razón Social" es obligatorio.');
            return;
        }
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
            const datosActualizados = {
                // Usa los nombres de campo exactos que espera tu base de datos (Firestore)
                RazonSocial: razonSocial.trim(),
                Tipo: tipo,
                Estatus: estatus,
                Uso: uso.trim(),
                Observaciones: observaciones.trim(),
                // fechaModificacion: new Date() // Opcional: si quieres rastrear la última modificación
            };
            await onUpdate(initialData.id, datosActualizados);
            // El componente padre (EstructuraEdicion) es responsable de llamar a onClose
            // lo que también limpiará `estructuraToEdit` a null, provocando que este modal
            // o se desmonte o su `useEffect` resetee el form si `initialData` se vuelve null.
        } catch (err) {
            console.error("Error al actualizar estructura:", err);
            setError(err.message || "No se pudo actualizar la estructura. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    // No renderizar si no está abierto o no hay datos iniciales (importante para editar)
    if (!isOpen || !initialData) return null;

    // --- JSX del Modal ---
    return (
        <div className="modal-overlay" onClick={onClose}> {/* onClose es pasado por el padre y maneja el reset de estado allí */}
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Editar Estructura <span className="modal-id">(ID: {initialData.id})</span></h2>
                <form onSubmit={handleSubmit}>
                    {/* Campo Razón Social */}
                    <div className="form-group">
                        <label htmlFor="edit-razonSocial">Razón Social (*):</label>
                        <input
                            type="text"
                            id="edit-razonSocial"
                            value={razonSocial}
                            onChange={(e) => setRazonSocial(e.target.value)}
                            disabled={isSaving}
                            autoFocus
                        />
                    </div>

                    {/* Campo Tipo - Select Picker */}
                    <div className="form-group">
                        <label htmlFor="edit-tipo">Tipo (*):</label>
                        <select
                            id="edit-tipo"
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

                    {/* Campo Estatus - Select Picker */}
                    <div className="form-group">
                        <label htmlFor="edit-estatus">Estatus (*):</label>
                        <select
                            id="edit-estatus"
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
                        <label htmlFor="edit-uso">Uso:</label>
                        <input
                            type="text"
                            id="edit-uso"
                            value={uso}
                            onChange={(e) => setUso(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>

                    {/* Campo Observaciones */}
                    <div className="form-group">
                        <label htmlFor="edit-observaciones">Observaciones:</label>
                        <textarea
                            id="edit-observaciones"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            disabled={isSaving}
                            rows="3"
                        />
                    </div>

                    {error && <p className="modal-error">{error}</p>}

                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Actualizando...' : 'Actualizar Cambios'}
                        </button>
                        <button type="button" className="button-cancel" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </button>
                    </div>
                </form>
                <button className="modal-close-button" onClick={onClose} disabled={isSaving} aria-label="Cerrar modal">&times;</button>
            </div>
        </div>
    );
};