// src/modals/AddDocumentoModal.jsx
import React, { useState } from 'react';
import './Modal.css'; // Reutilizar estilos generales de modal

export const AddDocumentoModal = ({ isOpen, onClose, onSave, estructuraId }) => {
    // Estados para cada campo del documento
    const [nombreDoc, setNombreDoc] = useState(''); // 'Documento' como nombre/tipo
    const [numero, setNumero] = useState('');
    const [fecha, setFecha] = useState(''); // string YYYY-MM-DD
    const [estatus, setEstatus] = useState('');
    const [linkDigital, setLinkDigital] = useState('');
    const [ubicacionFisica, setUbicacionFisica] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [original, setOriginal] = useState(0); // Input numérico
    const [copiasCertificadas, setCopiasCertificadas] = useState(0); // Input numérico

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setNombreDoc(''); setNumero(''); setFecha(''); setEstatus('');
        setLinkDigital(''); setUbicacionFisica(''); setObservaciones('');
        setOriginal(0); setCopiasCertificadas(0); setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validaciones básicas (puedes añadir más)
        if (!nombreDoc.trim()) { setError('El nombre del Documento es obligatorio.'); return; }
        if (!fecha) { setError('La Fecha es obligatoria.'); return; }
        // Validar que 'original' y 'copiasCertificadas' sean números no negativos
        const numOriginal = parseInt(original, 10);
        const numCopias = parseInt(copiasCertificadas, 10);
        if (isNaN(numOriginal) || numOriginal < 0) { setError('Cantidad "Original" debe ser un número válido (0 o más).'); return; }
        if (isNaN(numCopias) || numCopias < 0) { setError('Cantidad "Copias Certificadas" debe ser un número válido (0 o más).'); return; }


        setIsSaving(true);
        try {
            const nuevoDocumento = {
                nombre: nombreDoc.trim(),
                numero: numero.trim(),
                fecha, // Pasar como string YYYY-MM-DD, el padre convertirá a Timestamp
                estatus: estatus.trim(),
                linkDigital: linkDigital.trim(),
                ubicacionFisica: ubicacionFisica.trim(),
                observaciones: observaciones.trim(),
                original: numOriginal,
                copiasCertificadas: numCopias,
                fechaRegistro: new Date() // Añadir fecha de registro del documento
            };
            await onSave(nuevoDocumento); // Llama a onSave del padre
            resetForm();
            // onClose lo llama el padre después de éxito
        } catch (err) {
            console.error("Error guardando documento (modal):", err);
            setError(err.message || "No se pudo guardar el documento.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content modal-documento" onClick={e => e.stopPropagation()}>
                <h2>Añadir Documento a Estructura <span className="modal-id">(ID: {estructuraId || 'N/A'})</span></h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="add-doc-nombre">Documento (*):</label>
                        <input type="text" id="add-doc-nombre" value={nombreDoc} onChange={e => setNombreDoc(e.target.value)} disabled={isSaving} autoFocus/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-doc-numero">Número:</label>
                        <input type="text" id="add-doc-numero" value={numero} onChange={e => setNumero(e.target.value)} disabled={isSaving} />
                    </div>
                     <div className="form-group">
                        <label htmlFor="add-doc-fecha">Fecha (*):</label>
                        <input type="date" id="add-doc-fecha" value={fecha} onChange={e => setFecha(e.target.value)} disabled={isSaving} />
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
                    {/* Inputs numéricos */}
                     <div className="form-group form-group-inline-pair"> {/* Contenedor para ponerlos lado a lado */}
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
                <button className="modal-close-button" onClick={handleClose} disabled={isSaving} aria-label="Cerrar modal">&times;</button>
            </div>
        </div>
    );
};