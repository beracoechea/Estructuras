// src/modals/AddAntecedenteModal.jsx
import React, { useState } from 'react';
import '../modals/Modal.css'; // Asegúrate que este archivo existe y tiene estilos base

export const AddAntecedenteModal = ({ isOpen, onClose, onSave }) => {
    // --- Estado para NUEVO campo 'nombre' (Tipo Documento) ---
    const [nombre, setNombre] = useState(''); // Estado para el nuevo selector

    // --- Estados para campos existentes y nuevos ---
    const [escritura, setEscritura] = useState(''); // Se mantiene el campo original
    const [fechaCelebracion, setFechaCelebracion] = useState('');
    const [datosNotariales, setDatosNotariales] = useState('');
    const [folioRPP, setFolioRPP] = useState('');
    const [linkAcceso, setLinkAcceso] = useState('');
    const [estatusUbicacionFisica, setEstatusUbicacionFisica] = useState('');
    const [sociosFinales, setSociosFinales] = useState('');
    const [sociosRLfinales, setSociosRLfinales] = useState('');
    const [actosCelebrados, setActosCelebrados] = useState([]);
    const [newActo, setNewActo] = useState({ otorgamiento: '', responsable: '' });

    // --- Estados de control ---
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // --- Resetear todos los campos ---
    const resetForm = () => {
        setNombre(''); // <-- Resetear nuevo estado
        setEscritura('');
        setFechaCelebracion('');
        setDatosNotariales('');
        setFolioRPP('');
        setLinkAcceso('');
        setEstatusUbicacionFisica('');
        setSociosFinales('');
        setSociosRLfinales('');
        setActosCelebrados([]);
        setNewActo({ otorgamiento: '', responsable: '' });
        setError('');
    };

    // --- Cerrar modal (y resetear) ---
    const handleClose = () => {
        resetForm();
        onClose();
    };

    // --- Manejadores para la lista de Actos Celebrados (sin cambios) ---
    const handleNewActoChange = (field, value) => {
        setNewActo(prev => ({ ...prev, [field]: value }));
    };

    const handleAddActo = () => {
        if (!newActo.otorgamiento.trim() || !newActo.responsable.trim()) {
            setError('Debe ingresar Otorgamiento y Responsable para añadir el Acto.');
            return;
        }
        setActosCelebrados(prev => [...prev, { ...newActo }]);
        setNewActo({ otorgamiento: '', responsable: '' });
        setError('');
    };

    const handleRemoveActo = (indexToRemove) => {
        setActosCelebrados(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // --- Manejador del envío del formulario principal ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // --- Validaciones Actualizadas ---
        if (!nombre) { // Validar que se haya seleccionado un tipo
            setError('Debe seleccionar el Tipo de Documento.');
            return;
        }
        if (!escritura.trim()) { // Mantener validación para Escritura
            setError('El campo "Escritura" es obligatorio.');
            return;
        }
        if (!fechaCelebracion) {
            setError('El campo "Fecha de Celebración" es obligatorio.');
            return;
        }
        // Añadir más validaciones aquí si es necesario

        setIsSaving(true);
        try {
             // --- Objeto a Guardar Actualizado ---
            const nuevoAntecedente = {
                nombre: nombre, // <-- El valor del nuevo selector
                escritura: escritura.trim(), // <-- El valor del input original
                fechaCelebracion,
                datosNotariales: datosNotariales.trim(),
                folioRPP: folioRPP.trim(),
                linkAcceso: linkAcceso.trim(),
                estatusUbicacionFisica: estatusUbicacionFisica.trim(),
                sociosFinales: sociosFinales.trim(),
                sociosRLfinales: sociosRLfinales.trim(),
                actosCelebrados: actosCelebrados,
                fechaCreacion: new Date()
            };
            await onSave(nuevoAntecedente);
            resetForm();
        } catch (err) {
            console.error("Error al guardar antecedente (desde modal):", err);
            setError(err.message || "No se pudo guardar el antecedente. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // --- JSX del Modal Actualizado ---
    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content modal-antecedente" onClick={e => e.stopPropagation()}>
                <h2>Añadir Antecedente Societario</h2>
                <form onSubmit={handleSubmit}>

                    {/* --- NUEVO CAMPO: Selector 'nombre' (Tipo Documento) --- */}
                    <div className="form-group">
                        <label htmlFor="add-nombre-tipo">Tipo de Documento (*):</label>
                        <select
                            id="add-nombre-tipo"
                            value={nombre} // Vinculado al nuevo estado 'nombre'
                            onChange={e => setNombre(e.target.value)} // Actualiza 'nombre'
                            disabled={isSaving}
                            required
                            autoFocus // Foco en este campo al abrir
                        >
                            <option value="" disabled>-- Seleccione Tipo --</option>
                            <option value="Asamblea">Asamblea</option>
                            <option value="Constitutiva">Constitutiva</option>
                        </select>
                    </div>

                    {/* --- Campo original 'escritura' (se mantiene) --- */}
                    <div className="form-group">
                        <label htmlFor="add-escritura">Escritura / Identificador (*):</label>
                        <input
                            type="text"
                            id="add-escritura"
                            value={escritura} // Vinculado al estado 'escritura'
                            onChange={e => setEscritura(e.target.value)} // Actualiza 'escritura'
                            disabled={isSaving}
                        />
                    </div>

                    {/* --- Resto de los campos (sin cambios) --- */}
                    <div className="form-group">
                        <label htmlFor="add-fechaCelebracion">Fecha de Celebración (*):</label>
                        <input type="date" id="add-fechaCelebracion" value={fechaCelebracion} onChange={e => setFechaCelebracion(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-datosNotariales">Datos Notariales:</label>
                        <textarea id="add-datosNotariales" value={datosNotariales} onChange={e => setDatosNotariales(e.target.value)} rows="3" disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-folioRPP">Folio RPP:</label>
                        <input type="text" id="add-folioRPP" value={folioRPP} onChange={e => setFolioRPP(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-linkAcceso">Link de Acceso (URL):</label>
                        <input type="url" id="add-linkAcceso" value={linkAcceso} onChange={e => setLinkAcceso(e.target.value)} placeholder="https://ejemplo.com/documento" disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-estatusUbicacion">Estatus/Ubicación Física:</label>
                        <input type="text" id="add-estatusUbicacion" value={estatusUbicacionFisica} onChange={e => setEstatusUbicacionFisica(e.target.value)} disabled={isSaving} />
                    </div>
                     <div className="form-group">
                        <label htmlFor="add-sociosFinales">Socios Finales:</label>
                        <textarea id="add-sociosFinales" value={sociosFinales} onChange={e => setSociosFinales(e.target.value)} rows="3" placeholder="Listar socios..." disabled={isSaving} />
                    </div>
                     <div className="form-group">
                        <label htmlFor="add-sociosRLfinales">Representantes Legales Finales:</label>
                        <textarea id="add-sociosRLfinales" value={sociosRLfinales} onChange={e => setSociosRLfinales(e.target.value)} rows="3" placeholder="Listar representantes..." disabled={isSaving} />
                    </div>

                    {/* --- Sección para Actos Celebrados (sin cambios en JSX) --- */}
                    <div className="form-group form-group-dynamic-list">
                        <label>Actos Celebrados:</label>
                        <div className="dynamic-list-items">
                            {actosCelebrados.map((acto, index) => (
                                <div key={index} className="dynamic-list-item">
                                    <span className="item-text">
                                        <strong>Otor:</strong> {acto.otorgamiento} | <strong>Resp:</strong> {acto.responsable}
                                    </span>
                                    <button type="button" onClick={() => handleRemoveActo(index)} className="button-remove-item" title="Quitar este acto" disabled={isSaving} aria-label={`Quitar acto ${index + 1}`}>
                                        &times;
                                    </button>
                                </div>
                            ))}
                            {actosCelebrados.length === 0 && <p className="no-items-message">No se han añadido actos.</p>}
                        </div>
                        <div className="dynamic-list-add-form">
                            <div className="form-group-inline">
                                <label htmlFor="add-acto-otor">Nuevo Otorgamiento:</label>
                                <input type="text" id="add-acto-otor" placeholder="Ej. Poder General" value={newActo.otorgamiento} onChange={(e) => handleNewActoChange('otorgamiento', e.target.value)} disabled={isSaving} />
                            </div>
                             <div className="form-group-inline">
                                <label htmlFor="add-acto-resp">Nuevo Responsable:</label>
                                <input type="text" id="add-acto-resp" placeholder="Ej. Juan Pérez" value={newActo.responsable} onChange={(e) => handleNewActoChange('responsable', e.target.value)} disabled={isSaving} />
                            </div>
                            <button type="button" onClick={handleAddActo} className="button-add-item" disabled={isSaving || !newActo.otorgamiento.trim() || !newActo.responsable.trim()}>
                                + Añadir Acto
                            </button>
                        </div>
                    </div>

                    {/* --- Errores y Acciones (sin cambios) --- */}
                    {error && <p className="modal-error">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar Antecedente'}
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