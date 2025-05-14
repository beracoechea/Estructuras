// src/modals/AddPrestamoModal.jsx
import React, { useState } from 'react';
// Remove: import { Timestamp } from 'firebase/firestore'; // No longer directly used here for conversion
import './Modal.css';

export const AddPrestamoModal = ({ isOpen, onClose, onSavePrestamo, expedienteId, expedienteNombre, estructuraId }) => {
    const [fechaPrestamo, setFechaPrestamo] = useState(''); // This will be YYYY-MM-DD
    const [cantidadCopias, setCantidadCopias] = useState(1);
    const [observacionesPrestamo, setObservacionesPrestamo] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setFechaPrestamo('');
        setCantidadCopias(1);
        setObservacionesPrestamo('');
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fechaPrestamo) { // fechaPrestamo is the "YYYY-MM-DD" string
            setError("La fecha del préstamo es obligatoria.");
            return;
        }

        setIsSaving(true);
        setError(''); // Clear previous errors
        try {
            const nuevoPrestamo = {
                fechaPrestamo: fechaPrestamo, // Pass the YYYY-MM-DD string directly
                cantidadCopiasPrestadas: parseInt(cantidadCopias, 10),
                observaciones: observacionesPrestamo.trim(),
            };
            await onSavePrestamo(nuevoPrestamo); // Llama a la función del padre
            // onClose(); // Moved to finally or success block if saveNuevoPrestamo handles closing
            handleClose(); // Or ensure onClose from parent does the full reset and modal closing.
                           // saveNuevoPrestamo in usePrestamosLogic calls closeAddPrestamoModal.
                           // So, EstructuraDetalle's handleClosePrestamoModal will be called eventually.
                           // Calling onClose() here (which is handleClosePrestamoModal from EstructuraDetalle)
                           // might be redundant if saveNuevoPrestamo always closes, but safer to ensure cleanup.
                           // For now, let's assume saveNuevoPrestamo (via handleSavePrestamoWrapper) handles successful closure.
                           // If an error occurs in onSavePrestamo before it closes, this onClose() would close it.
                           // It's better that onSavePrestamo or its chain handles closing on success.
                           // The original code had onClose() after await onSavePrestamo.
                           // Let's keep it to ensure the modal closes from this component's perspective after attempting save.

        } catch (errorCaught) { // Changed variable name to avoid conflict with outer scope error state
            setError(errorCaught.message || "Error al guardar el préstamo.");
        } finally {
            setIsSaving(false);
            // If save was successful, onSavePrestamo should have triggered closure.
            // If it failed, an error is set. The modal stays open for user to see error.
            // The original code called onClose() inside the try block after await.
            // This means it would close on success.
            // Let's ensure that if onSavePrestamo succeeds, EstructuraDetalle.handleClosePrestamoModal is called
            // (which happens because usePrestamosLogic.closeAddPrestamoModal is called).
            // If onSavePrestamo itself throws, it's caught here.
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={!isSaving ? handleClose : undefined}>
            <div className="modal-content modal-prestamo" onClick={e => e.stopPropagation()}>
                <h2>Registrar Préstamo para: <span className="modal-subtitle">{expedienteNombre || `Expediente ID: ${expedienteId}`}</span></h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="prestamo-fecha">Fecha del Préstamo (*):</label>
                        <input
                            type="date"
                            id="prestamo-fecha"
                            value={fechaPrestamo}
                            onChange={e => setFechaPrestamo(e.target.value)}
                            disabled={isSaving}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="prestamo-cantidad">Cantidad de Copias Prestadas (*):</label>
                        <input
                            type="number"
                            id="prestamo-cantidad"
                            value={cantidadCopias}
                            min="1"
                            onChange={e => setCantidadCopias(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="prestamo-observaciones">Observaciones del Préstamo:</label>
                        <textarea
                            id="prestamo-observaciones"
                            value={observacionesPrestamo}
                            onChange={e => setObservacionesPrestamo(e.target.value)}
                            rows="3"
                            disabled={isSaving}
                        />
                    </div>
                    {error && <p className="modal-error">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Registrando...' : 'Registrar Préstamo'}
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