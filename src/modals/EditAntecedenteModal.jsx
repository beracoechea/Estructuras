import React, { useState, useEffect } from 'react';
import './Modal.css'; // Reutilizar los estilos del modal

// Helper para convertir Timestamp a string YYYY-MM-DD para el input date
const timestampToInputDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    try {
        const date = timestamp.toDate();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Error convirtiendo timestamp a string de fecha:", e);
        return '';
    }
};

export const EditAntecedenteModal = ({ isOpen, onClose, onUpdate, initialData }) => {
    // El initialData esperado es el objeto antecedente completo que se va a editar
    const antecedenteData = initialData?.data || null; // Acceder a los datos dentro del objeto
    const antecedenteIndex = initialData?.index ?? -1; // Asegurarse de tener el índice

    // --- Estados para campos (inicializados desde initialData) ---
    const [nombre, setNombre] = useState('');
    const [escritura, setEscritura] = useState('');
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

    // --- Cargar datos iniciales cuando el modal se abre o cambian los datos ---
    useEffect(() => {
        if (antecedenteData && isOpen) { // Cargar solo si hay datos y está abierto
            setNombre(antecedenteData.nombre || '');
            setEscritura(antecedenteData.escritura || '');
            setFechaCelebracion(timestampToInputDate(antecedenteData.fechaCelebracion)); // Convertir Timestamp
            setDatosNotariales(antecedenteData.datosNotariales || '');
            setFolioRPP(antecedenteData.folioRPP || '');
            setLinkAcceso(antecedenteData.linkAcceso || '');
            setEstatusUbicacionFisica(antecedenteData.estatusUbicacionFisica || '');
            setSociosFinales(antecedenteData.sociosFinales || '');
            setSociosRLfinales(antecedenteData.sociosRLfinales || '');
            setActosCelebrados(Array.isArray(antecedenteData.actosCelebrados) ? [...antecedenteData.actosCelebrados] : []); // Copiar array
            setNewActo({ otorgamiento: '', responsable: '' }); // Limpiar inputs de nuevo acto
            setError(''); // Limpiar errores al abrir/recargar
        }
        // No es necesario un 'else' para limpiar aquí, se limpia al cerrar si es necesario
    }, [antecedenteData, isOpen]); // Depende de los datos iniciales y del estado de apertura

    // --- Cerrar modal (Limpiar error solamente) ---
    const handleClose = () => {
        setError(''); // Limpiar error al cerrar
        onClose(); // Llama a la función onClose del padre
        // El padre se encargará de limpiar antecedenteToEdit, lo que puede disparar useEffect si se reabre
    };

    // --- Manejadores para lista de Actos Celebrados (Igual que en Add modal) ---
    const handleNewActoChange = (field, value) => setNewActo(prev => ({ ...prev, [field]: value }));
    const handleAddActo = () => {
        if (!newActo.otorgamiento.trim() || !newActo.responsable.trim()) { setError('Otorgamiento y Responsable requeridos para añadir Acto.'); return; }
        setActosCelebrados(prev => [...prev, { ...newActo }]);
        setNewActo({ otorgamiento: '', responsable: '' });
        setError('');
    };
    const handleRemoveActo = (indexToRemove) => setActosCelebrados(prev => prev.filter((_, index) => index !== indexToRemove));

    // --- Manejador del envío del formulario de edición ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (antecedenteIndex < 0) { setError("Error: No se puede identificar qué antecedente editar."); return; }
        if (!nombre) { setError('Debe seleccionar el Tipo de Documento.'); return; }
        if (!escritura.trim()) { setError('El campo "Escritura" es obligatorio.'); return; }
        if (!fechaCelebracion) { setError('La "Fecha de Celebración" es obligatoria.'); return; }

        setIsSaving(true);
        try {
            const datosActualizados = {
                // Mantener fechaCreacion original si existe, sino null
                fechaCreacion: antecedenteData?.fechaCreacion || null,
                // Incluir todos los campos del formulario
                nombre: nombre,
                escritura: escritura.trim(),
                fechaCelebracion: fechaCelebracion, // Pasar string YYYY-MM-DD, el padre convertirá
                datosNotariales: datosNotariales.trim(),
                folioRPP: folioRPP.trim(),
                linkAcceso: linkAcceso.trim(),
                estatusUbicacionFisica: estatusUbicacionFisica.trim(),
                sociosFinales: sociosFinales.trim(),
                sociosRLfinales: sociosRLfinales.trim(),
                actosCelebrados: actosCelebrados,
                // Añadir o actualizar una fecha de última modificación
                fechaActualizacion: new Date() // El padre lo convertirá a Timestamp
            };

            // Llama a la función onUpdate pasada por props con el índice y los datos nuevos
            await onUpdate(antecedenteIndex, datosActualizados);
            // El componente padre se encargará de cerrar el modal
        } catch (err) {
            console.error("Error al actualizar antecedente (desde modal):", err);
            setError(err.message || "No se pudo actualizar el antecedente. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    // No renderizar si no está abierto o no hay datos
    if (!isOpen || !antecedenteData) return null;

    // --- JSX del Modal (Similar al de Añadir, pero usa los estados locales pre-cargados) ---
    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content modal-antecedente" onClick={e => e.stopPropagation()}>
                <h2>Editar Antecedente Societario</h2>
                <form onSubmit={handleSubmit}>
                    {/* --- Campos del formulario --- */}
                    {/* Tipo Documento */}
                    <div className="form-group">
                        <label htmlFor="edit-nombre-tipo">Tipo de Documento (*):</label>
                        <select id="edit-nombre-tipo" value={nombre} onChange={e => setNombre(e.target.value)} disabled={isSaving} required autoFocus>
                            <option value="" disabled>-- Seleccione Tipo --</option>
                            <option value="Asamblea">Asamblea</option>
                            <option value="Constitutiva">Constitutiva</option>
                        </select>
                    </div>
                    {/* Escritura */}
                    <div className="form-group">
                        <label htmlFor="edit-escritura">Escritura / Identificador (*):</label>
                        <input type="text" id="edit-escritura" value={escritura} onChange={e => setEscritura(e.target.value)} disabled={isSaving} />
                    </div>
                    {/* Fecha Celebración */}
                    <div className="form-group">
                         <label htmlFor="edit-fechaCelebracion">Fecha de Celebración (*):</label>
                         <input type="date" id="edit-fechaCelebracion" value={fechaCelebracion} onChange={e => setFechaCelebracion(e.target.value)} disabled={isSaving} />
                     </div>
                    {/* Datos Notariales */}
                     <div className="form-group">
                         <label htmlFor="edit-datosNotariales">Datos Notariales:</label>
                         <textarea id="edit-datosNotariales" value={datosNotariales} onChange={e => setDatosNotariales(e.target.value)} rows="3" disabled={isSaving} />
                     </div>
                     {/* Folio RPP */}
                     <div className="form-group">
                        <label htmlFor="edit-folioRPP">Folio RPP:</label>
                        <input type="text" id="edit-folioRPP" value={folioRPP} onChange={e => setFolioRPP(e.target.value)} disabled={isSaving} />
                     </div>
                     {/* Link Acceso */}
                     <div className="form-group">
                        <label htmlFor="edit-linkAcceso">Link de Acceso (URL):</label>
                        <input type="url" id="edit-linkAcceso" value={linkAcceso} onChange={e => setLinkAcceso(e.target.value)} placeholder="https://..." disabled={isSaving} />
                     </div>
                     {/* Estatus Ubicación */}
                     <div className="form-group">
                        <label htmlFor="edit-estatusUbicacion">Estatus/Ubicación Física:</label>
                        <input type="text" id="edit-estatusUbicacion" value={estatusUbicacionFisica} onChange={e => setEstatusUbicacionFisica(e.target.value)} disabled={isSaving} />
                     </div>
                     {/* Socios Finales */}
                     <div className="form-group">
                        <label htmlFor="edit-sociosFinales">Socios Finales:</label>
                        <textarea id="edit-sociosFinales" value={sociosFinales} onChange={e => setSociosFinales(e.target.value)} rows="3" placeholder="Listar..." disabled={isSaving} />
                     </div>
                     {/* Socios RL Finales */}
                     <div className="form-group">
                        <label htmlFor="edit-sociosRLfinales">Representantes Legales Finales:</label>
                        <textarea id="edit-sociosRLfinales" value={sociosRLfinales} onChange={e => setSociosRLfinales(e.target.value)} rows="3" placeholder="Listar..." disabled={isSaving} />
                     </div>

                    {/* --- Sección Actos Celebrados (Editable) --- */}
                     <div className="form-group form-group-dynamic-list">
                        <label>Actos Celebrados:</label>
                        <div className="dynamic-list-items">
                            {actosCelebrados.map((acto, index) => (
                                <div key={index} className="dynamic-list-item">
                                    <span className="item-text"><strong>Otor:</strong> {acto.otorgamiento} | <strong>Resp:</strong> {acto.responsable}</span>
                                    <button type="button" onClick={() => handleRemoveActo(index)} className="button-remove-item" title="Quitar" disabled={isSaving} aria-label={`Quitar ${index + 1}`}>&times;</button>
                                </div>
                            ))}
                            {actosCelebrados.length === 0 && <p className="no-items-message">No se han añadido actos.</p>}
                        </div>
                        <div className="dynamic-list-add-form">
                            <div className="form-group-inline"><label htmlFor="edit-acto-otor">Nuevo Otorgamiento:</label><input type="text" id="edit-acto-otor" placeholder="Ej. Poder" value={newActo.otorgamiento} onChange={(e) => handleNewActoChange('otorgamiento', e.target.value)} disabled={isSaving}/></div>
                            <div className="form-group-inline"><label htmlFor="edit-acto-resp">Nuevo Responsable:</label><input type="text" id="edit-acto-resp" placeholder="Ej. Nombre Apellido" value={newActo.responsable} onChange={(e) => handleNewActoChange('responsable', e.target.value)} disabled={isSaving}/></div>
                            <button type="button" onClick={handleAddActo} className="button-add-item" disabled={isSaving || !newActo.otorgamiento.trim() || !newActo.responsable.trim()}>+ Añadir Acto</button>
                        </div>
                    </div>

                    {/* --- Errores y Acciones --- */}
                    {error && <p className="modal-error">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Actualizando...' : 'Guardar Cambios'}
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