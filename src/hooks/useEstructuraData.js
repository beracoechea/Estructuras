// src/hooks/useEstructuraData.js
import { useState, useCallback, useEffect } from 'react';
import { firestore } from '../config/firebase-config'; // Ajusta la ruta
import { doc, getDoc } from 'firebase/firestore';

export const useEstructuraData = (estructuraId) => {
    const [estructura, setEstructura] = useState(null);
    const [loadingEstructura, setLoadingEstructura] = useState(true);
    const [errorEstructura, setErrorEstructura] = useState(null);

    const fetchEstructuraDetalle = useCallback(async () => {
        if (!estructuraId) {
            setLoadingEstructura(false);
            setErrorEstructura("ID de estructura no proporcionado.");
            return;
        }
        setLoadingEstructura(true);
        setErrorEstructura(null);
        try {
            const estructuraRef = doc(firestore, "Estructuras", estructuraId);
            const docSnap = await getDoc(estructuraRef);
            if (docSnap.exists()) {
                setEstructura({ id: docSnap.id, ...docSnap.data() });
            } else {
                setErrorEstructura("No se encontró la estructura solicitada.");
                setEstructura(null);
            }
        } catch (err) {
            console.error("Error al cargar la estructura:", err);
            setErrorEstructura("Error al cargar los detalles de la estructura.");
            setEstructura(null);
        }
        setLoadingEstructura(false);
    }, [estructuraId]);

    useEffect(() => {
        fetchEstructuraDetalle();
    }, [fetchEstructuraDetalle]);

    return { estructura, loadingEstructura, errorEstructura, fetchEstructuraDetalle };
};