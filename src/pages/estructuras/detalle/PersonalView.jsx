import React, { useState, useEffect } from 'react';
import './PersonalView.css'; // Asegúrate de tener este archivo con los estilos

export const PersonalView = ({
    personalIndex,
    selectedEmpleadoDetails,
    loading,
    error,
    handlers
}) => {
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState('');
    const [newEmpleadoName, setNewEmpleadoName] = useState('');
    const [newDocumentoName, setNewDocumentoName] = useState('');

    // Efecto para cargar los detalles cuando el usuario selecciona un empleado del dropdown
    useEffect(() => {
        if (selectedEmpleadoId) {
            handlers.fetchEmpleadoDetails(selectedEmpleadoId);
        }
    }, [selectedEmpleadoId]); // Se dispara cada vez que la selección cambia

    // Efecto para auto-seleccionar el primer empleado de la lista cuando se carga
    useEffect(() => {
        if (!selectedEmpleadoId && personalIndex && personalIndex.length > 0) {
            setSelectedEmpleadoId(personalIndex[0].id);
        }
    }, [personalIndex]);

    const handleAddEmpleado = async () => {
        if (!newEmpleadoName.trim()) {
            alert("Por favor, introduce el nombre del empleado.");
            return;
        }
        const result = await handlers.addEmpleado(newEmpleadoName);
        if (result.success) {
            setNewEmpleadoName('');
        }
    };

    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="personal-view-container">
            <div className="card add-section">
                <h3>Agregar Nuevo Empleado</h3>
                <div className="form-group">
                    <input
                        type="text"
                        value={newEmpleadoName}
                        onChange={(e) => setNewEmpleadoName(e.target.value)}
                        placeholder="Nombre completo del empleado"
                    />
                    <button onClick={handleAddEmpleado} disabled={loading} className="button-primary">
                        {loading ? 'Guardando...' : 'Cargar Empleado'}
                    </button>
                </div>
            </div>

            <div className="card view-section">
                <h3>Expedientes de Personal</h3>
                <div className="form-group">
                    <label htmlFor="empleado-select">Selecciona un empleado:</label>
                    <select id="empleado-select" value={selectedEmpleadoId} onChange={(e) => setSelectedEmpleadoId(e.target.value)}>
                        <option value="" disabled>-- Ver expediente de... --</option>
                        {personalIndex.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                        ))}
                    </select>
                </div>
                
                {loading && <p>Actualizando...</p>}

                {selectedEmpleadoDetails ? (
                    <div className="document-list">
                        <h4>Documentos de: <strong>{selectedEmpleadoDetails.nombre}</strong></h4>
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Documento</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>Se Tiene</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEmpleadoDetails.documentos.map((doc, index) => (
                                    <tr key={index}>
                                        <td>{doc.nombre}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                className="custom-checkbox"
                                                checked={doc.seTiene}
                                                onChange={(e) => handlers.updateDocumentoStatus(selectedEmpleadoDetails.id, doc.nombre, e.target.checked)}
                                                disabled={loading}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Aquí puedes añadir la lógica para agregar documentos custom si lo necesitas */}
                    </div>
                ) : (
                    !loading && <p>Selecciona un empleado para ver sus documentos.</p>
                )}
            </div>
        </div>
    );
};