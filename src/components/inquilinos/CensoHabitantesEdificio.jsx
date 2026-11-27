import { useState, useEffect, useMemo } from 'react';
import {
  Building,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  Users,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { BASE_URL, getAuthHeaders, handleResponse } from '../../api/config';
import {
  listarContratos,
  listarHabitantesContratos
} from '../../services/contratoService';
import { listarUsuarios } from '../../services/usuarioService';

// Paleta de colores suaves por piso (igual a la hoja impresa)
const COLORES_PISO_UI = [
  'bg-[#e9e4ef]', // Piso 1: lavanda suave
  'bg-[#dff0f4]', // Piso 2: celeste suave
  'bg-[#e4f1e6]', // Piso 3: verde menta suave
  'bg-[#fdf2df]', // Piso 4: crema suave
  'bg-[#fbe7e7]', // Piso 5: rosado suave
];

const COLORES_PISO_PDF = [
  [233, 228, 239],
  [223, 240, 244],
  [228, 241, 230],
  [253, 242, 223],
  [251, 231, 231],
];

export function CensoHabitantesEdificio() {
  const [loading, setLoading] = useState(true);
  const [edificios, setEdificios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [habitantesAll, setHabitantesAll] = useState([]);
  const [usuariosMap, setUsuariosMap] = useState({});

  const [edificioSeleccionadoId, setEdificioSeleccionadoId] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDatosCenso();
  }, []);

  const cargarDatosCenso = async () => {
    setLoading(true);
    try {
      const [
        resEdificios,
        resDeptos,
        dataContratos,
        resHabitantes,
        dataUsers,
      ] = await Promise.all([
        fetch(`${BASE_URL}/edificios`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        fetch(`${BASE_URL}/departamentos`, { headers: getAuthHeaders() }).then(handleResponse).catch(() => []),
        listarContratos().catch(() => []),
        listarHabitantesContratos().catch(() => []),
        listarUsuarios().catch(() => []),
      ]);

      const listaEd = Array.isArray(resEdificios) ? resEdificios : [];
      setEdificios(listaEd);
      if (listaEd.length > 0) {
        setEdificioSeleccionadoId(String(listaEd[0].id_edificio || listaEd[0].id));
      }

      setDepartamentos(Array.isArray(resDeptos) ? resDeptos : []);
      setContratos(Array.isArray(dataContratos) ? dataContratos : []);
      setHabitantesAll(Array.isArray(resHabitantes) ? resHabitantes : []);

      const mapU = {};
      if (Array.isArray(dataUsers)) {
        dataUsers.forEach((u) => {
          mapU[u.id_usuario || u.id] = u;
        });
      }
      setUsuariosMap(mapU);
    } catch (error) {
      console.error('Error cargando censo:', error);
      toast.error('No se pudo cargar el padrón de habitantes');
    } finally {
      setLoading(false);
    }
  };

  const edificioActual = useMemo(() => {
    return edificios.find(
      (e) => String(e.id_edificio || e.id) === String(edificioSeleccionadoId)
    );
  }, [edificios, edificioSeleccionadoId]);

  // Construir las filas ordenadas por PISO y NÚMERO DE DEPTO
  const filasCenso = useMemo(() => {
    if (!edificioSeleccionadoId) return [];

    const deptosEdificio = departamentos
      .filter((d) => String(d.id_edificio) === String(edificioSeleccionadoId))
      .sort((a, b) => {
        const pisoA = Number(a.piso || 0);
        const pisoB = Number(b.piso || 0);
        if (pisoA !== pisoB) return pisoA - pisoB;
        return String(a.numero_departamento || '').localeCompare(
          String(b.numero_departamento || ''),
          undefined,
          { numeric: true }
        );
      });

    return deptosEdificio.map((depto) => {
      const idDepto = Number(depto.id_departamento || depto.id);
      const piso = Number(depto.piso || 1);
      const numDepto = depto.numero_departamento || 'S/N';
      const pisoDeptoTexto = `${piso} - ${numDepto}`;

      // Buscar contrato vigente del departamento
      const contratoVigente = contratos.find(
        (c) =>
          Number(c.id_departamento) === idDepto &&
          !['FINALIZADO', 'CANCELADO'].includes((c.estado || 'DIRECTO').toUpperCase())
      );

      if (!contratoVigente) {
        return {
          idDepto,
          piso,
          pisoDepto: pisoDeptoTexto,
          vacio: true,
          cantidadPersonas: '',
          textoHabitantes: 'VACIO',
          telefonos: '',
          observaciones: (depto.observaciones || '').toUpperCase(),
        };
      }

      const idContrato = Number(contratoVigente.id_contrato || contratoVigente.id);
      const habsContrato = habitantesAll.filter(
        (h) =>
          Number(h.id_contrato) === idContrato &&
          (h.estado || 'ACTIVO').toUpperCase() === 'ACTIVO'
      );

      const titularUsuario = usuariosMap[contratoVigente.id_usuario];

      // Si no hay filas en tabla habitante aún, usar datos del titular del contrato
      let listaPersonas = habsContrato;
      if (listaPersonas.length === 0 && titularUsuario) {
        listaPersonas = [
          {
            nombres: titularUsuario.nombre || '',
            primer_apellido: titularUsuario.primer_apellido || '',
            segundo_apellido: titularUsuario.segundo_apellido || '',
            parentesco: 'Titular',
            nacionalidad: titularUsuario.nacionalidad || 'Boliviana',
            telefono: titularUsuario.telefono || '',
            observaciones: '',
          },
        ];
      }

      const cantidad = listaPersonas.length;
      const cantidadTexto =
        cantidad === 1 ? '1 PERSONA' : `${cantidad} PERSONAS`;

      // Concatenar nombres completos en mayúsculas separados por " - "
      const nombresConcatenados = listaPersonas
        .map((p) =>
          `${p.nombres || ''} ${p.primer_apellido || ''} ${p.segundo_apellido || ''}`
            .trim()
            .toUpperCase()
        )
        .filter(Boolean)
        .join(' – ');

      // Parentescos únicos entre paréntesis
      const parentescosUnicos = [
        ...new Set(
          listaPersonas
            .map((p) => (p.parentesco || '').trim().toUpperCase())
            .filter(Boolean)
        ),
      ];
      const bloqueParentescos =
        parentescosUnicos.length > 0 ? ` (${parentescosUnicos.join(' Y ')})` : '';

      // Nacionalidades únicas entre paréntesis
      const nacionalidadesUnicas = [
        ...new Set(
          listaPersonas
            .map((p) => (p.nacionalidad || '').trim().toUpperCase())
            .filter(Boolean)
        ),
      ];
      const bloqueNacionalidades =
        nacionalidadesUnicas.length > 0
          ? ` (${nacionalidadesUnicas.join(' - ')})`
          : '';

      const textoHabitantesFinal = `${nombresConcatenados}${bloqueParentescos}${bloqueNacionalidades}`;

      // Teléfonos únicos
      const telefonosSet = new Set();
      listaPersonas.forEach((p) => {
        if (p.telefono && String(p.telefono).trim()) {
          telefonosSet.add(String(p.telefono).trim());
        }
      });
      if (titularUsuario?.telefono && String(titularUsuario.telefono).trim()) {
        telefonosSet.add(String(titularUsuario.telefono).trim());
      }
      const telefonosTexto = Array.from(telefonosSet).join(' - ');

      // Observaciones de los habitantes + observación del depto si existe
      const obsSet = new Set();
      listaPersonas.forEach((p) => {
        if (p.observaciones && String(p.observaciones).trim()) {
          obsSet.add(String(p.observaciones).trim().toUpperCase());
        }
      });
      if (depto.observaciones && String(depto.observaciones).trim()) {
        obsSet.add(String(depto.observaciones).trim().toUpperCase());
      }

      return {
        idDepto,
        piso,
        pisoDepto: pisoDeptoTexto,
        vacio: false,
        cantidadPersonas: cantidadTexto,
        textoHabitantes: textoHabitantesFinal,
        telefonos: telefonosTexto,
        observaciones: Array.from(obsSet).join(' Y '),
      };
    });
  }, [
    edificioSeleccionadoId,
    departamentos,
    contratos,
    habitantesAll,
    usuariosMap,
  ]);

  const filasFiltradas = useMemo(() => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return filasCenso;
    return filasCenso.filter(
      (f) =>
        f.pisoDepto.toLowerCase().includes(term) ||
        f.textoHabitantes.toLowerCase().includes(term) ||
        f.telefonos.toLowerCase().includes(term) ||
        f.observaciones.toLowerCase().includes(term)
    );
  }, [filasCenso, busqueda]);

  // EXPORTAR A EXCEL (.XLSX)
  const handleExportarExcel = () => {
    const nombreEdificio = (edificioActual?.nombre || 'EDIFICIO').toUpperCase();
    const titulo = `LISTA DE PERSONAS QUE VIVEN EN ${nombreEdificio}`;

    const datosHoja = [
      [titulo],
      [],
      [
        'PISO - DPTO',
        'NUMERO DE HABITANTES POR DEPARTAMENTO',
        'NOMBRES HABITANTES EN EL DEPARTAMENTO',
        'NÚMEROS DE CONTACTO',
        'OBSERVACIONES',
      ],
      ...filasFiltradas.map((f) => [
        f.pisoDepto,
        f.cantidadPersonas,
        f.textoHabitantes,
        f.telefonos,
        f.observaciones,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(datosHoja);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 24 },
      { wch: 65 },
      { wch: 26 },
      { wch: 32 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Censo Habitantes');
    XLSX.writeFile(wb, `Lista_Habitantes_${nombreEdificio.replace(/\s+/g, '_')}.xlsx`);
    toast.success('Planilla Excel descargada');
  };

  // EXPORTAR A PDF (Mismo formato visual de la planilla)
  const handleExportarPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const nombreEdificio = (edificioActual?.nombre || 'EDIFICIO').toUpperCase();

    // Título centrado subrayado
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const titulo = `LISTA DE PERSONAS QUE VIVEN EN ${nombreEdificio}`;
    doc.text(titulo, 148.5, 16, { align: 'center' });
    const textWidth = doc.getTextWidth(titulo);
    doc.setLineWidth(0.5);
    doc.line(148.5 - textWidth / 2, 17.2, 148.5 + textWidth / 2, 17.2);

    // Columnas
    const startX = 12;
    let y = 23;
    const colWidths = [22, 36, 128, 42, 45]; // Total = 273mm
    const headers = [
      'PISO\nDPTO',
      'NUMERO DE\nHABITANTES POR\nDEPARTAMENTO',
      'NOMBRES HABITANTES EN EL DEPARTAMENTO',
      'NÚMEROS DE\nCONTACTO',
      'OBSERVACIONES',
    ];

    // Dibujar encabezado naranja
    const headerH = 13;
    doc.setFillColor(246, 189, 138);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    let x = startX;
    doc.setFontSize(8);
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], headerH, 'FD');
      const lines = h.split('\n');
      const lineSpacing = 3.3;
      const startTextY = y + headerH / 2 - ((lines.length - 1) * lineSpacing) / 2 + 1;
      lines.forEach((line, lIdx) => {
        doc.text(line, x + colWidths[i] / 2, startTextY + lIdx * lineSpacing, {
          align: 'center',
        });
      });
      x += colWidths[i];
    });

    y += headerH;

    // Dibujar filas
    filasFiltradas.forEach((fila) => {
      const colorFila = COLORES_PISO_PDF[(Math.max(1, fila.piso) - 1) % COLORES_PISO_PDF.length];
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(8.5);
      const lineasNombres = doc.splitTextToSize(fila.textoHabitantes, colWidths[2] - 4);
      const lineasObs = doc.splitTextToSize(fila.observaciones || '', colWidths[4] - 3);
      const maxLineas = Math.max(1, lineasNombres.length, lineasObs.length);
      const rowH = Math.max(7.5, maxLineas * 4 + 3);

      // Salto de página automático
      if (y + rowH > 198) {
        doc.addPage();
        y = 15;
      }

      x = startX;

      // Col 1: Piso - Depto (verde oliva)
      doc.setFillColor(127, 127, 78);
      doc.rect(x, y, colWidths[0], rowH, 'FD');
      doc.setFont('times', 'bold');
      doc.setFontSize(8.5);
      doc.text(fila.pisoDepto, x + colWidths[0] / 2, y + rowH / 2 + 1.2, { align: 'center' });
      x += colWidths[0];

      // Col 2: Cantidad personas
      doc.setFillColor(...colorFila);
      doc.rect(x, y, colWidths[1], rowH, 'FD');
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.text(fila.cantidadPersonas, x + colWidths[1] / 2, y + rowH / 2 + 1.2, { align: 'center' });
      x += colWidths[1];

      // Col 3: Nombres habitantes
      doc.setFillColor(...colorFila);
      doc.rect(x, y, colWidths[2], rowH, 'FD');
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(8.5);
      const startYNom = y + rowH / 2 - ((lineasNombres.length - 1) * 3.8) / 2 + 1.2;
      lineasNombres.forEach((ln, idxLn) => {
        doc.text(ln, x + colWidths[2] / 2, startYNom + idxLn * 3.8, { align: 'center' });
      });
      x += colWidths[2];

      // Col 4: Teléfonos
      doc.setFillColor(...colorFila);
      doc.rect(x, y, colWidths[3], rowH, 'FD');
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.text(fila.telefonos, x + colWidths[3] / 2, y + rowH / 2 + 1.2, { align: 'center' });
      x += colWidths[3];

      // Col 5: Observaciones
      doc.setFillColor(...colorFila);
      doc.rect(x, y, colWidths[4], rowH, 'FD');
      doc.setFont('times', 'bold');
      doc.setFontSize(7.5);
      const startYObs = y + rowH / 2 - ((lineasObs.length - 1) * 3.5) / 2 + 1;
      lineasObs.forEach((lo, idxLo) => {
        doc.text(lo, x + colWidths[4] / 2, startYObs + idxLo * 3.5, { align: 'center' });
      });

      y += rowH;
    });

    doc.save(`Lista_Personas_${nombreEdificio.replace(/\s+/g, '_')}.pdf`);
    toast.success('Planilla PDF descargada');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra de controles superior */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Selector de Edificio */}
          <div className="relative flex items-center min-w-[230px]">
            <Building size={17} className="absolute left-3.5 text-blue-600 pointer-events-none" />
            <select
              value={edificioSeleccionadoId}
              onChange={(e) => setEdificioSeleccionadoId(e.target.value)}
              className="w-full py-2.5 pl-10 pr-6 bg-white border border-slate-200 rounded-xl text-sm font-extrabold text-slate-800 outline-none focus:border-blue-600 cursor-pointer shadow-xs"
            >
              {edificios.map((ed) => (
                <option key={ed.id_edificio || ed.id} value={ed.id_edificio || ed.id}>
                  {ed.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador rápido */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex-1 max-w-md focus-within:border-blue-600">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Filtrar por piso-depto, nombre, teléfono u observación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-transparent border-none outline-none ml-2 text-sm text-slate-800 w-full"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Botones Exportar PDF y Excel */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportarExcel}
            disabled={loading || filasFiltradas.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>

          <button
            type="button"
            onClick={handleExportarPDF}
            disabled={loading || filasFiltradas.length === 0}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <FileText size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Planilla Visual */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span className="text-sm font-semibold">Generando padrón de habitantes del edificio...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-2">
            <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide underline decoration-2 underline-offset-4">
              LISTA DE PERSONAS QUE VIVEN EN {(edificioActual?.nombre || 'EDIFICIO').toUpperCase()}
            </h3>
          </div>

          <div className="overflow-x-auto border border-slate-900 rounded-lg shadow-xs">
            <table className="w-full border-collapse text-xs min-w-[820px]">
              <thead>
                <tr className="bg-[#f6bd8a] text-slate-950 font-black uppercase text-center border-b border-slate-900">
                  <th className="py-3 px-2 border-r border-slate-900 w-24">
                    PISO<br />DPTO
                  </th>
                  <th className="py-3 px-3 border-r border-slate-900 w-40">
                    NÚMERO DE HABITANTES POR DEPARTAMENTO
                  </th>
                  <th className="py-3 px-4 border-r border-slate-900 text-sm">
                    NOMBRES HABITANTES EN EL DEPARTAMENTO
                  </th>
                  <th className="py-3 px-3 border-r border-slate-900 w-44">
                    NÚMEROS DE CONTACTO
                  </th>
                  <th className="py-3 px-3 w-52">
                    OBSERVACIONES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filasFiltradas.length > 0 ? (
                  filasFiltradas.map((fila) => {
                    const colorFila =
                      COLORES_PISO_UI[(Math.max(1, fila.piso) - 1) % COLORES_PISO_UI.length];

                    return (
                      <tr key={fila.idDepto} className={`${colorFila} text-slate-950`}>
                        {/* Piso - Depto */}
                        <td className="py-2.5 px-2 bg-[#7f7f4e] text-slate-950 font-black text-center border-r border-slate-900">
                          {fila.pisoDepto}
                        </td>

                        {/* Número de habitantes */}
                        <td className="py-2.5 px-3 text-center font-semibold border-r border-slate-900">
                          {fila.cantidadPersonas}
                        </td>

                        {/* Nombres concatenados o VACIO */}
                        <td className="py-2.5 px-4 text-center font-extrabold italic border-r border-slate-900">
                          {fila.textoHabitantes}
                        </td>

                        {/* Teléfonos */}
                        <td className="py-2.5 px-3 text-center font-semibold border-r border-slate-900">
                          {fila.telefonos}
                        </td>

                        {/* Observaciones */}
                        <td className="py-2.5 px-3 text-center font-extrabold uppercase">
                          {fila.observaciones}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-500 bg-white">
                      No hay departamentos registrados para este edificio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}