// import { useNavigate } from 'react-router-dom'; // Descomentar si realmente se necesita para navegar desde aquí
import { useEstructuras } from '../../hooks/useEstructure'; 
import { AddEstructuraModal } from '../../modals/AddEstructuraModal';
import { EditEstructuraModal } from '../../modals/EditEstructuraModal';
import React,{useCallback,useState} from 'react';

import './EstructuraConsulta.css';
import '../../modals/Modal.css';

export const EstructuraEdicion = ({ userInfo }) => {
    const {
        estructuras,
        loading,
        error,
        addEstructura,
        updateEstructura
        // fetchEstructuras // Puedes mantenerlo si tienes un botón de refresco manual
    } = useEstructuras();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [estructuraToEdit, setEstructuraToEdit] = useState(null);

    // const navigate = useNavigate(); // Descomentar y usar si es necesario

    const openAddModal = () => setIsAddModalOpen(true);
    const openEditModal = (estructura) => {
        setEstructuraToEdit(estructura);
        setIsEditModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setEstructuraToEdit(null);
    };

    const handleSaveNewEstructura = async (nuevaEstructuraData) => {
        // Asegúrate que nuevaEstructuraData contenga los campos correctos:
        // RazonSocial, Tipo, Estatus, Uso, Observaciones
        try {
            await addEstructura(nuevaEstructuraData);
            closeModal();
        } catch (err) {
            console.error("Error al guardar desde el componente:", err.message);
            alert(err.message);
        }
    };

    const handleUpdateEstructura = useCallback(async (id, datos) => {
        try {
            await updateEstructura(id, datos);
            // Cierra el modal solo si la actualización fue exitosa
            setEstructuraToEdit(null); // Esto cerrará el modal
        } catch (error) {
            // Maneja el error sin cerrar el modal
            console.error("Error al actualizar:", error);
        }
    }, []);

    if (loading) {
        return <div className="consulta-status-container"><p>Cargando estructuras...</p></div>;
    }

    if (error) {
        return <div className="consulta-status-container error"><p>{error}</p></div>;
    }

    return (
        <div className="estructura-consulta-container">
            <div className="edicion-header">
                <h1>Panel de Edición"</h1>
                <button className="button-add-new" onClick={openAddModal}>
                    + Añadir Nueva Estructura
                </button>
            </div>

            {estructuras.length === 0 ? (
                <div className="consulta-status-container no-data">
                    <p>No hay estructuras para mostrar. ¡Añade una nueva!</p>
                </div>
            ) : (
                <div className="estructuras-scroll-container">
                    {estructuras.map((estructura) => (
                        <div
                            key={estructura.id}
                            className="estructura-card card-editable"
                            onClick={() => openEditModal(estructura)}
                            tabIndex={0}
                            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') openEditModal(estructura); }}
                        >
                            <h3>{estructura.RazonSocial || 'Sin Razón Social'}</h3>
                            <p className="card-field"><strong>Tipo:</strong> {estructura.Tipo || 'No especificado'}</p>
                            <p className="card-field"><strong>Estatus:</strong> {estructura.Estatus || 'No especificado'}</p>
                            <p className="card-field"><strong>Uso:</strong> {estructura.Uso || 'No especificado'}</p>
                        </div>
                    ))}
                </div>
            )}

            <AddEstructuraModal
                isOpen={isAddModalOpen}
                onClose={closeModal}
                onSave={handleSaveNewEstructura}
                // Pasa los campos esperados si el modal necesita alguna estructura por defecto
            />

            <EditEstructuraModal
                isOpen={isEditModalOpen}
                onClose={closeModal}
                onUpdate={handleUpdateEstructura}
                initialData={estructuraToEdit} // Esto ya pasará la estructura completa con los nuevos campos
            />
        </div>
    );
};