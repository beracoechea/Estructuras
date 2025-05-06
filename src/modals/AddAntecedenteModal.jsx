// src/modals/AddAntecedenteModal.jsx
import React, { useState } from 'react';
import '../modals/Modal.css';

export const AddAntecedenteModal = ({ isOpen, onClose, onSave }) => {
    const [escritura, setEscritura] = useState('');
    const [fechaCelebracion, setFechaCelebracion] = useState(''); // Usar input type="date"
    const [datosNotariales, setDatosNotariales] = useState('');
    const [folioRPP, setFolioRPP] = useState('');
    const [linkAcceso, setLinkAcceso] = useState('');
    const [estatusUbicacionFisica, setEstatusUbicacionFisica] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setEscritura('');
        setFechaCelebracion('');
        setDatosNotariales('');
        setFolioRPP('');
        setLinkAcceso('');
        setEstatusUbicacionFisica('');
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!escritura.trim()) { // Ejemplo de validación
            setError('El campo "Escritura" es obligatorio.');
            return;
        }
        if (!fechaCelebracion) {
            setError('El campo "Fecha de Celebración" es obligatorio.');
            return;
        }


        setIsSaving(true);
        try {
            const nuevoAntecedente = {
                escritura: escritura.trim(),
                fechaCelebracion, // Se pasará como string 'YYYY-MM-DD', se convertirá a Timestamp en el padre
                datosNotariales: datosNotariales.trim(),
                folioRPP: folioRPP.trim(),
                linkAcceso: linkAcceso.trim(),
                estatusUbicacionFisica: estatusUbicacionFisica.trim(),
            };
            await onSave(nuevoAntecedente); // onSave se encargará de la conversión de fecha y guardado
            resetForm(); // onClose será llamado por el padre tras el éxito
        } catch (err) {
            console.error("Error al guardar antecedente (desde modal):", err);
            setError(err.message || "No se pudo guardar el antecedente. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Añadir Antecedente Societario</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="add-escritura">Escritura (*):</label>
                        <input type="text" id="add-escritura" value={escritura} onChange={e => setEscritura(e.target.value)} disabled={isSaving} autoFocus />
                    </div>
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