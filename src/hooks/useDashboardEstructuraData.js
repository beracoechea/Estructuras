// src/hooks/useDashboardEstructuraData.js
import { useMemo, useState } from 'react';

const MESES_NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const useDashboardEstructuraData = (expedientesGenerales, expedientesMensuales) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const estatusSummaryGenerales = useMemo(() => {
        if (!expedientesGenerales || expedientesGenerales.length === 0) return [];
        const counts = expedientesGenerales.reduce((acc, exp) => {
            const estatus = exp.estatus || "No especificado";
            acc[estatus] = (acc[estatus] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [expedientesGenerales]);

    const estatusSummaryMensuales = useMemo(() => {
        if (!expedientesMensuales || expedientesMensuales.length === 0) return [];
        const counts = expedientesMensuales.reduce((acc, exp) => {
            const estatus = exp.estatus || "No especificado";
            acc[estatus] = (acc[estatus] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [expedientesMensuales]);

    const complianceDataForYear = useMemo(() => {
        if (!expedientesMensuales || expedientesMensuales.length === 0) {
            return {
                overallPercentage: 0,
                byMonth: MESES_NOMBRES.map(m => ({ name: m, Cumplimiento: 0, completados: 0, total: 0 })),
                byType: [], totalPossibleChecks: 0, totalCompletedChecks: 0,
            };
        }
        // ... (exactamente la misma lógica de cálculo que tenías en DashboardEstructuraView)
        let totalCompletedChecksInYear = 0;
        const completedChecksPerMonth = Array(12).fill(0);
        const complianceByType = expedientesMensuales.map(exp => {
            const checksOfYear = exp.checksMensuales?.[selectedYear] || Array(12).fill(false);
            let completedForThisExp = 0;
            const possibleForThisExpInYear = 12;
            checksOfYear.forEach((check) => { if (check === true) completedForThisExp++; });
            totalCompletedChecksInYear += completedForThisExp; // Mover esto aquí
            // Corrección en el cálculo de completedChecksPerMonth
            checksOfYear.forEach((check, monthIndex) => { if (check === true) completedChecksPerMonth[monthIndex]++; });

            return { name: exp.nombre, Cumplimiento: possibleForThisExpInYear > 0 ? (completedForThisExp / possibleForThisExpInYear) * 100 : 0, completados: completedForThisExp, total: possibleForThisExpInYear };
        });
        const totalPossibleChecksInYear = expedientesMensuales.length * 12;
        const complianceByMonth = MESES_NOMBRES.map((mesNombre, index) => {
            const totalExpParaEsteMes = expedientesMensuales.length;
            return { name: mesNombre, Cumplimiento: totalExpParaEsteMes > 0 ? (completedChecksPerMonth[index] / totalExpParaEsteMes) * 100 : 0, completados: completedChecksPerMonth[index], total: totalExpParaEsteMes, };
        });
        return {
            overallPercentage: totalPossibleChecksInYear > 0 ? (totalCompletedChecksInYear / totalPossibleChecksInYear) * 100 : 0,
            byMonth: complianceByMonth, byType: complianceByType,
            totalPossibleChecks: totalPossibleChecksInYear, totalCompletedChecks: totalCompletedChecksInYear,
        };
    }, [expedientesMensuales, selectedYear]);

    // Generar opciones de años
    const currentDisplayYearHook = new Date().getFullYear();
    const yearOptions = useMemo(() => {
        const options = [];
        for (let i = currentDisplayYearHook + 2; i >= currentDisplayYearHook - 5; i--) {
            options.push(i);
        }
        return options;
    }, [currentDisplayYearHook]);


    return {
        selectedYear,
        setSelectedYear,
        yearOptions,
        estatusSummaryGenerales,
        estatusSummaryMensuales,
        complianceDataForYear
    };
};