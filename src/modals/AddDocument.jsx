// src/modals/AddDocumentoModal.jsx
import React, { useState } from 'react';
import './Modal.css'; // Reutilizar estilos generales de modal

export const AddDocumentoModal = ({ isOpen, onClose, onSave, estructuraId }) => {
    // Estados para cada campo del documento
    const [nombreDoc, setNombreDoc] = useState('');
    const [numero, setNumero] = useState('');
    const [fecha, setFecha] = useState(''); // string YYYY-MM-DD
    const [estatus, setEstatus] = useState('');
    const [linkDigital, setLinkDigital] = useState('');
    const [ubicacionFisica, setUbicacionFisica] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [original, setOriginal] = useState(0);
    const [copiasCertificadas, setCopiasCertificadas] = useState(0);
    const [fechaVencimiento, setFechaVencimiento] = useState(''); // <-- NUEVO ESTADO

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setNombreDoc(''); setNumero(''); setFecha(''); setEstatus('');
        setLinkDigital(''); setUbicacionFisica(''); setObservaciones('');
        setOriginal(0); setCopiasCertificadas(0);
        setFechaVencimiento(''); // <-- RESETEAR NUEVO ESTADO
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!nombreDoc.trim()) { setError('El nombre del Documento es obligatorio.'); return; }
        if (!fecha) { setError('La Fecha es obligatoria.'); return; }

        const numOriginal = parseInt(original, 10);
        const numCopias = parseInt(copiasCertificadas, 10);
        if (isNaN(numOriginal) || numOriginal < 0) { setError('Cantidad "Original" debe ser un número válido (0 o más).'); return; }
        if (isNaN(numCopias) || numCopias < 0) { setError('Cantidad "Copias Certificadas" debe ser un número válido (0 o más).'); return; }

        // Validación opcional para fecha de vencimiento: que sea posterior a la fecha del documento
        if (fecha && fechaVencimiento && new Date(fechaVencimiento) < new Date(fecha)) {
            setError('La fecha de vencimiento no puede ser anterior a la fecha del documento.');
            return;
        }

        setIsSaving(true);
        try {
            const nuevoDocumento = {
                nombre: nombreDoc.trim(),
                numero: numero.trim(),
                fecha, // Se pasa como string, el hook/padre lo convertirá a Timestamp
                estatus: estatus.trim(),
                linkDigital: linkDigital.trim(),
                ubicacionFisica: ubicacionFisica.trim(),
                observaciones: observaciones.trim(),
                original: numOriginal,
                copiasCertificadas: numCopias,
                fechaVencimiento: fechaVencimiento || null, // <-- AÑADIR AL OBJETO. Guardar null si está vacío.
                fechaRegistro: new Date() // Se convertirá a Timestamp en el hook/padre
            };
            await onSave(nuevoDocumento);
            resetForm();
            // onClose() será llamado por el componente padre (EstructuraDetalle a través del hook) después de un guardado exitoso.
        } catch (err) {
            console.error("Error guardando documento (modal):", err);
            setError(err.message || "No se pudo guardar el documento.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={!isSaving ? handleClose : undefined /* Evitar cerrar si está guardando */}>
            <div className="modal-content modal-documento" onClick={e => e.stopPropagation()}>
                <h2>Añadir Documento a Estructura <span className="modal-id">(ID: {estructuraId ? estructuraId.slice(0,6) + '...' : 'N/A'})</span></h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="add-doc-nombre">Documento (*):</label>
                        <input type="text" id="add-doc-nombre" value={nombreDoc} onChange={e => setNombreDoc(e.target.value)} disabled={isSaving} autoFocus/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-doc-numero">Número/Identificador:</label>
                        <input type="text" id="add-doc-numero" value={numero} onChange={e => setNumero(e.target.value)} disabled={isSaving} />
                    </div>
                    {/* Fechas lado a lado */}
                    <div className="form-group-inline-pair">
                        <div className="form-group">
                            <label htmlFor="add-doc-fecha">Fecha del Documento (*):</label>
                            <input type="date" id="add-doc-fecha" value={fecha} onChange={e => setFecha(e.target.value)} disabled={isSaving} />
                        </div>
                        <div className="form-group"> {/* <-- NUEVO CAMPO */}
                            <label htmlFor="add-doc-fechaVencimiento">Fecha de Vencimiento:</label>
                            <input type="date" id="add-doc-fechaVencimiento" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} disabled={isSaving} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-doc-estatus">Estatus:</label>
                        <input type="text" id="add-doc-estatus" value={estatus} onChange={e => setEstatus(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-doc-link">Link Digital (URL):</label>
                        <input type="url" id="add-doc-link" value={linkDigital} onChange={e => setLinkDigital(e.target.value)} placeholder="https://" disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-doc-ubicacion">Ubicación Física:</label>
                        <input type="text" id="add-doc-ubicacion" value={ubicacionFisica} onChange={e => setUbicacionFisica(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-doc-observaciones">Observaciones:</label>
                        <textarea id="add-doc-observaciones" value={observaciones} onChange={e => setObservaciones(e.target.value)} rows="3" disabled={isSaving}></textarea>
                    </div>
                    <div className="form-group form-group-inline-pair">
                        <div className="form-group-inline">
                            <label htmlFor="add-doc-original">Original (Cant.):</label>
                            <input type="number" id="add-doc-original" value={original} min="0" onChange={e => setOriginal(e.target.value)} disabled={isSaving} />
                        </div>
                        <div className="form-group-inline">
                            <label htmlFor="add-doc-copias">Copias Cert. (Cant.):</label>
                            <input type="number" id="add-doc-copias" value={copiasCertificadas} min="0" onChange={e => setCopiasCertificadas(e.target.value)} disabled={isSaving} />
                        </div>
                    </div>

                    {error && <p className="modal-error">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar Documento'}
                        </button>
                        <button type="button" className="button-cancel" onClick={handleClose} disabled={isSaving}>
                            Cancelar
                        </button>
                    </div>
                </form>
                <button className="modal-close-button" onClick={!isSaving ? handleClose : undefined} disabled={isSaving} aria-label="Cerrar modal">&times;</button>
            </div>
        </div>
    );
};