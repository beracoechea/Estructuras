import { useState, useEffect, useCallback,useMemo } from 'react';
import { firestore } from '../config/firebase-config'; // Ajusta la ruta si es necesario
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';

export const useEstructuras = () => {
    const [estructuras, setEstructuras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mueve la referencia a la colección dentro del hook para que sea constante
    const estructurasCollectionRef = useMemo(() => collection(firestore, "Estructuras"), []);

    const fetchEstructuras = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const querySnapshot = await getDocs(estructurasCollectionRef);
            const estructurasData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEstructuras(estructurasData);
        } catch (err) {
            console.error("Error al obtener las estructuras:", err);
            setError("Error al cargar los datos. Inténtelo más tarde.");
        } finally {
            setLoading(false);
        }
    }, [estructurasCollectionRef]); // Dependencia correcta

    useEffect(() => {
        fetchEstructuras();
    }, [fetchEstructuras]); // Solo se ejecuta cuando fetchEstructuras cambie

    const addEstructura = async (nuevaEstructuraData) => {
        try {
            await addDoc(estructurasCollectionRef, nuevaEstructuraData);
            await fetchEstructuras(); // Refrescar los datos después de añadir
            // Opcionalmente, podrías añadir la nueva estructura al estado local aquí
            // para una UI más rápida, pero fetchEstructuras asegura consistencia.
        } catch (err) {
            console.error("Error al añadir documento desde el hook: ", err);
            throw new Error("No se pudo guardar la estructura en la base de datos (desde hook).");
        }
    };

    const updateEstructura = async (id, datosActualizados) => {
        try {
            const estructuraDocRef = doc(firestore, "Estructuras", id);
            await updateDoc(estructuraDocRef, datosActualizados);
            await fetchEstructuras(); // Refrescar los datos después de actualizar
             // Alternativa: Actualizar solo el item modificado en el estado local 'estructuras'.
        } catch (err) {
            console.error("Error al actualizar documento desde el hook: ", err);
            throw new Error("No se pudo actualizar la estructura en la base de datos (desde hook).");
        }
    };

    return {
        estructuras,
        loading,
        error,
        fetchEstructuras, // Exponer por si se necesita refresco manual desde el componente
        addEstructura,
        updateEstructura
    };
};