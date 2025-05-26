// src/pages/estructuras/detalle/DashboardEstructuraView.jsx
import React from 'react'; // useState y useMemo ya no son necesarios aquí directamente para estos cálculos
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useDashboardEstructuraData } from '../../../hooks/useDashboardEstructuraData'; // <-- IMPORTA EL NUEVO HOOK
import './DashboardEstructuraView.css';

// Colores para los gráficos de pastel
const PIE_CHART_COLORS_GENERALES = ['#6A1B9A', '#AD1457', '#1E88E5', '#00ACC1', '#43A047', '#FDD835', '#FB8C00'];

// Custom Tooltip (sin cambios)
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="custom-tooltip">
                <p className="label">{`${label}`}</p>
                <p className="desc">{`Cumplimiento: ${payload[0].value.toFixed(1)}%`}</p>
                {data.completados !== undefined && data.total !== undefined && (
                    <p className="intro">{`Checks: ${data.completados} de ${data.total}`}</p>
                )}
            </div>
        );
    }
    return null;
};

export const DashboardEstructuraView = ({
    estructuraId, // Sigue siendo útil para el contexto o si el hook lo necesitara
    estructuraNombre,
    expedientesMensuales,
    expedientesGenerales,
    loading, // Prop de carga general desde EstructuraDetalle
    error,   // Prop de error general desde EstructuraDetalle
}) => {
    // Usar el nuevo hook para obtener los datos procesados y el manejo del año
    const {
        selectedYear,
        setSelectedYear,
        yearOptions,
        estatusSummaryGenerales,
        estatusSummaryMensuales,
        complianceDataForYear
    } = useDashboardEstructuraData(expedientesGenerales, expedientesMensuales); // Pasamos los datos crudos al hook

    // El loading y error principales vienen como props, ya que dependen de la carga
    // de expedientesGenerales y expedientesMensuales en EstructuraDetalle
    if (loading) return <div className="status-container"><p>Cargando datos del dashboard para {estructuraNombre}...</p></div>;
    if (error) return <div className="status-container error"><p>Error cargando datos del dashboard: {error}</p></div>;

    // Si los expedientes aún no llegan pero no hay un error/loading del padre,
    // los useMemo en el hook devolverán arrays vacíos o valores por defecto.
    // Podemos añadir un chequeo adicional si las listas de expedientes están vacías
    const noHayDatosGenerales = !expedientesGenerales || expedientesGenerales.length === 0;
    const noHayDatosMensuales = !expedientesMensuales || expedientesMensuales.length === 0;


    return (
        <div className="dashboard-estructura-view detalle-seccion">
            <h2>Dashboard: {estructuraNombre}</h2>

            {/* SECCIÓN PARA ESTATUS DE EXPEDIENTES GENERALES */}
            <div className="dashboard-section">
                <h3>Distribución de Estatus (Expedientes Generales)</h3>
                {noHayDatosGenerales ? (
                    <p className="no-data-chart">No se cargaron expedientes generales para esta estructura.</p>
                ) : estatusSummaryGenerales.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={estatusSummaryGenerales} cx="50%" cy="50%" labelLine={false}
                                label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={100} fill="#82ca9d" dataKey="value" nameKey="name"
                            >
                                {estatusSummaryGenerales.map((entry, index) => (
                                    <Cell key={`cell-general-${index}`} fill={PIE_CHART_COLORS_GENERALES[index % PIE_CHART_COLORS_GENERALES.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} expediente(s)`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="no-data-chart">No hay datos de estatus para los expedientes generales.</p>
                )}
            </div>

          

             {/* SECCIÓN PARA CUMPLIMIENTO DE CHECKS MENSUALES */}
            <div className="dashboard-section">
                 <h3>Cumplimiento de Checks Mensuales ({noHayDatosMensuales ? 0 : expedientesMensuales.length} tipos de exp.)</h3>
                {noHayDatosMensuales ? (
                    <p className="no-data-chart">No hay expedientes mensuales para analizar cumplimiento.</p>
                ) : (
                    <>
                        <div className="year-selector-dashboard">
                            <label htmlFor="year-select-dashboard">Seleccionar Año: </label>
                            <select id="year-select-dashboard" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}>
                                {yearOptions.map(year => (<option key={year} value={year}>{year}</option>))}
                            </select>
                        </div>
                        <h4>Resumen General de Cumplimiento para {selectedYear}</h4>
                        {complianceDataForYear.totalPossibleChecks > 0 ? (
                            <>
                                <p>
                                    <strong>Porcentaje General:</strong> {complianceDataForYear.overallPercentage.toFixed(1)}%
                                    ({complianceDataForYear.totalCompletedChecks} de {complianceDataForYear.totalPossibleChecks} checks completados)
                                </p>
                                <div className="progress-bar-container overall-progress" style={{maxWidth: '500px', margin: '10px auto'}}>
                                    <div className="progress-bar" style={{width: `${complianceDataForYear.overallPercentage.toFixed(1)}%`, backgroundColor: '#007bff'}}>
                                        {complianceDataForYear.overallPercentage.toFixed(1)}%
                                    </div>
                                </div>
                            </>
                        ) : ( <p className="no-data-chart">No hay checks para el año {selectedYear}.</p> )}

                        <h4 style={{marginTop: '30px'}}>Cumplimiento por Mes ({selectedYear})</h4>
                        {complianceDataForYear.byMonth.some(m => m.total > 0) ? (
                             <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={complianceDataForYear.byMonth} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} unit="%" label={{ value: 'Cumplimiento', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="top" wrapperStyle={{ lineHeight: '40px' }}/>
                                    <Bar dataKey="Cumplimiento" fill="#82ca9d" name="Cumplimiento Mensual (%)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : ( <p className="no-data-chart">No hay datos de cumplimiento mensual para {selectedYear}.</p> )}

                        <h4 style={{marginTop: '30px'}}>Cumplimiento por Tipo de Expediente Mensual ({selectedYear})</h4>
                         {complianceDataForYear.byType.length > 0 ? ( // byType siempre tendrá la misma longitud que expedientesMensuales
                             <ResponsiveContainer width="100%" height={30 * complianceDataForYear.byType.length + 60 < 200 ? 200 : 30 * complianceDataForYear.byType.length + 60}>
                                <BarChart data={complianceDataForYear.byType} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                                     <CartesianGrid strokeDasharray="3 3" />
                                     <XAxis type="number" domain={[0, 100]} unit="%" label={{ value: 'Cumplimiento (%)', position: 'insideBottom', offset: -5 }}/>
                                     <YAxis type="category" dataKey="name" width={150} style={{fontSize: '0.9em'}}/>
                                     <Tooltip content={<CustomTooltip />} />
                                     <Legend verticalAlign="top" wrapperStyle={{ lineHeight: '40px' }}/>
                                     <Bar dataKey="Cumplimiento" fill="#8884d8" name="Cumplimiento por Expediente (%)" radius={[0, 4, 4, 0]} barSize={20} />
                                 </BarChart>
                             </ResponsiveContainer>
                         ) : ( <p className="no-data-chart">No hay tipos de expedientes mensuales para analizar en {selectedYear}.</p> )}
                    </>
                )}
            </div>
        </div>
    );
};