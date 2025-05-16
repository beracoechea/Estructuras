// src/modals/AddExpedienteMensualModal.jsx
import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore'; // Necesario para fechaRegistro, etc.
import './Modal.css'; // Asume que tienes un Modal.css general o crea uno específico

export const AddExpedienteMensualModal = ({ isOpen, onClose, onSave, estructuraId }) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    // Aquí puedes añadir más campos que el usuario deba definir al crear un nuevo tipo
    // de expediente mensual, por ejemplo, un recordatorio de vencimiento general.
    // const [fechaVencimientoRecordatorioGeneral, setFechaVencimientoRecordatorioGeneral] = useState('');


    const handleInternalSave = () => {
        if (!nombre.trim()) {
            alert("El nombre es obligatorio para el expediente mensual.");
            return;
        }

        // Crear el objeto del nuevo expediente mensual
        const nuevoExpediente = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            tipo: "mensual", // Tipo fijo
            estatus: "Activo", // O un valor por defecto como 'Pendiente'
            checksMensuales: { [new Date().getFullYear()]: Array(12).fill(false) }, // Inicializar checks para el año actual
            fechaRegistro: Timestamp.now(),
            fechaActualizacion: Timestamp.now(),
            // Si tienes un campo 'orden' para los expedientes, aquí deberías calcular el siguiente.
            // El hook 'addNewCustomExpedienteMensual' se encargará de esto.
            // Si tienes un campo 'fechaVencimientoRecordatorioGeneral' lo añadirías aquí
            // fechaVencimientoRecordatorioGeneral: fechaVencimientoRecordatorioGeneral ? Timestamp.fromDate(new Date(fechaVencimientoRecordatorioGeneral)) : null,
        };
        
        onSave(nuevoExpediente); // Esta función viene de EstructuraDetalle y llama al hook
        
        // Resetear formulario y cerrar
        setNombre('');
        setDescripcion('');
        // setFechaVencimientoRecordatorioGeneral('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-add-exp-mensual" onClick={e => e.stopPropagation()}>
                <h2>Definir Nuevo Tipo de Expediente Mensual</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleInternalSave(); }}>
                    <div className="form-group">
                        <label htmlFor="nombre-exp-mensual-add">Nombre del Expediente (*):</label>
                        <input 
                            id="nombre-exp-mensual-add" 
                            type="text" 
                            value={nombre} 
                            onChange={e => setNombre(e.target.value)} 
                            placeholder="Ej: Declaración Mensual ISR" 
                            required 
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="desc-exp-mensual-add">Descripción (Opcional):</label>
                        <textarea 
                            id="desc-exp-mensual-add" 
                            value={descripcion} 
                            onChange={e => setDescripcion(e.target.value)} 
                            placeholder="Detalles sobre este tipo de expediente mensual" 
                            rows="3"
                        />
                    </div>
                    {/*
                    <div className="form-group">
                        <label htmlFor="vencimiento-recordatorio-general-add">Fecha Vencimiento Recordatorio General (Opcional):</label>
                        <input 
                            id="vencimiento-recordatorio-general-add"
                            type="date"
                            value={fechaVencimientoRecordatorioGeneral}
                            onChange={e => setFechaVencimientoRecordatorioGeneral(e.target.value)}
                        />
                    </div>
                    */}
                    <div className="modal-actions">
                        <button type="submit" className="button-save">Guardar Tipo</button>
                        <button type="button" onClick={onClose} className="button-cancel">Cancelar</button>
                    </div>
                </form>
                <button className="modal-close-button" onClick={onClose} aria-label="Cerrar modal">&times;</button>
            </div>
        </div>
    );
};