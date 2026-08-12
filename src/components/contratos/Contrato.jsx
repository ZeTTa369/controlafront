import { useState } from 'react';
import { Printer, ArrowLeft, FileText, BookOpen } from 'lucide-react';

export function Contrato({ datosContrato, onVolver }) {
  const [seccionActiva, setSeccionActiva] = useState('vista_previa');

  // Datos dinámicos con respaldo completo del texto del documento legal
  const c = datosContrato || {
    propietario: {
      nombre: 'LUIS GABRIEL CLAROS ARISPE',
      ci: '5613935 con QR',
      nacionalidad: 'boliviano',
      inmuebleNombre: 'SALÓN DE EVENTOS GAVIOTA',
      ubicacion: 'Cochabamba, Z. CHILIMARCA-MOLLE MOLLE, DIST. 5, MZA. 31',
      matricula: '3.09.3.01.0005681 VIGENTE asiento A-4',
      zona: 'Cruce Taquiña'
    },
    arrendataria: {
      nombre: 'MILENKA GIOVANNA ALAVIA GOMEZ',
      ci: '5319873 con QR',
      nacionalidad: 'boliviana',
      dependientes: 'sus cuatro hijos'
    },
    inmueble: {
      departamento: 'C',
      piso: '2do piso',
      llaves: 4
    },
    condiciones: {
      canonMensual: '1.550,00',
      canonLiteral: 'Un mil quinientos cincuenta 00/100 bolivianos',
      garantia: '1.700,00',
      garantiaLiteral: 'Un Mil Setecientos 00/100 bolivianos',
      diaPagoInicio: 17,
      diaPagoFin: 20,
      fechaInicio: '17 de marzo de 2026',
      fechaFin: '16 de marzo de 2027',
      luzPorPersona: '40.-',
      aguaPorPersona: '40.-',
      expensas: '150.-',
      totalServicios: '430.-'
    },
    fechaSuscripcion: '17 de marzo de 2026'
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* NAVEGACIÓN Y HERRAMIENTAS (NO IMPRIMIBLE) */}
      <div className="print:hidden bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          {onVolver && (
            <button 
              onClick={onVolver} 
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Documento Legal Oficial Completo
            </span>
            <h1 className="text-xl font-black text-white mt-1">
              Contrato Privado de Alquiler — Dpto {c.inmueble.departamento}
            </h1>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all"
        >
          <Printer size={18} /> Imprimir / PDF
        </button>
      </div>

      {/* PESTAÑAS (NO IMPRIMIBLE) */}
      <div className="print:hidden flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm">
        <button
          onClick={() => setSeccionActiva('vista_previa')}
          className={`flex-1 py-3 font-bold text-sm rounded-xl flex items-center justify-center gap-2 ${
            seccionActiva === 'vista_previa' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={18} /> Contrato (13 Cláusulas Integrales)
        </button>
        <button
          onClick={() => setSeccionActiva('reglamento')}
          className={`flex-1 py-3 font-bold text-sm rounded-xl flex items-center justify-center gap-2 ${
            seccionActiva === 'reglamento' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={18} /> Anexo: Reglamento Interno
        </button>
      </div>

      {/* DOCUMENTO TEXTO COMPLETO */}
      <div className="bg-white p-8 md:p-14 rounded-2xl shadow-xl border border-slate-200 text-slate-900 font-serif leading-relaxed text-justify print:shadow-none print:border-none print:p-0 print:m-0 print:text-black">
        
        {/* ================= CONTRATO COMPLETO (13 CLÁUSULAS TEXTUALES) ================= */}
        {seccionActiva === 'vista_previa' && (
          <article className="space-y-6 text-sm">
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-6">
              <h1 className="text-base md:text-lg font-black tracking-wider text-slate-900 uppercase">
                DOCUMENTO PRIVADO DE ALQUILER DE DEPARTAMENTO
              </h1>
            </div>

            <p>
              Conste por el presente <strong>DOCUMENTO PRIVADO DE ALQUILER DE DEPARTAMENTO</strong> entre los que suscriben, que a solo reconocimiento de firmas por autoridad competente surtirá efectos legales sobre lo siguiente:
            </p>

            {/* CLÁUSULA PRIMERA */}
            <div className="space-y-2">
              <p><strong>CLÁUSULA PRIMERA. – (De las partes Intervinientes). -</strong> Constituyen partes esenciales del presente instrumento:</p>
              <p className="pl-4">
                <strong>1.1.</strong> El Señor <strong>{c.propietario.nombre}</strong>, mayor de edad, hábil por ley, de nacionalidad {c.propietario.nacionalidad}, con cédula de identidad {c.propietario.ci}, mismo que en lo sucesivo se denominará el <strong>PROPIETARIO</strong>.<br />
                <strong>1.2.</strong> La Señora <strong>{c.arrendataria.nombre}</strong>, mayor de edad, hábil por ley, de nacionalidad {c.arrendataria.nacionalidad}, con cédula de identidad {c.arrendataria.ci}, misma que en lo sucesivo se denominará la <strong>ARRENDATARIA</strong>.
              </p>
            </div>

            {/* CLÁUSULA SEGUNDA */}
            <p>
              <strong>CLÁUSULA SEGUNDA. – (Antecedentes del derecho propietario). -</strong> El Señor {c.propietario.nombre}, declara ser actual dueño y legítimo PROPIETARIO del bien inmueble denominado “{c.propietario.inmuebleNombre}” situado en la ciudad de {c.propietario.ubicacion}, registrado en Derechos Reales bajo la MATRÍCULA COMPUTARIZADA N° {c.propietario.matricula}, zona {c.propietario.zona} y que dentro del mismo se encuentra ubicado el departamento signado como “{c.inmueble.departamento}” situado en el {c.inmueble.piso} del bien inmueble.
            </p>

            {/* CLÁUSULA TERCERA */}
            <p>
              <strong>CLÁUSULA TERCERA. – (Del objeto). -</strong> Al presente, a mérito del derecho propietario que le asiste al PROPIETARIO y siendo que la norma ampara la libre disposición del mismo de acuerdo al Código Civil Boliviano y la Ley del Inquilinato y siendo dentro de sus necesidades y requerimientos el PROPIETARIO decide disponer el bien inmueble y darlo en calidad de ALQUILER, específicamente el departamento signado como “{c.inmueble.departamento}” ubicado en el {c.inmueble.piso} dentro del bien inmueble descrito en cláusula segunda, es decir dentro del bien inmueble denominado “{c.propietario.inmuebleNombre}”, disposición que la realiza por necesidad e interés propio, departamento que será disponible única y exclusivamente con fines de vivienda, siendo que la Señora {c.arrendataria.nombre}, ingresará habitar dicho departamento en calidad de ARRENDATARIA, donde habitarán ella y {c.arrendataria.dependientes} únicamente.
            </p>

            {/* CLÁUSULA CUARTA */}
            <div className="space-y-2">
              <p><strong>CLÁUSULA CUARTA. – (Características del departamento a alquilar - Entrega de llaves). -</strong></p>
              <p className="pl-4">
                <strong>4.1.</strong> El departamento cedido en calidad de ALQUILER a la Señora {c.arrendataria.nombre}, se encuentra al interior del inmueble del “{c.propietario.inmuebleNombre}”, identificado como departamento “{c.inmueble.departamento}” en el {c.inmueble.piso}, mismo que consta de: dos dormitorios con sus roperos empotrados, dos baños privados, living comedor, lavandería, área de secado, cocina con cajonería alta y baja. Actualmente se encuentra en buenas condiciones de habitabilidad de acuerdo a lo estipulado por el Art. 9 inc. a) de la Ley del Inquilinato respecto a entregar y mantener el inmueble alquilado en condiciones de habitabilidad, recientemente pintado al momento de su entrega, siendo que es de conocimiento de la ARRENDATARIA por lo que se le entrega a su entera conformidad, conformidad y elemento indispensable a fin de que concurran observaciones al término del contrato; debiendo entregar la ARRENDATARIA el departamento en las mismas condiciones de habitabilidad a momento de su ingreso de acuerdo a lo establecido por el Art. 14 inc. b) y e) de la Ley del Inquilinato, respecto a las obligaciones de la ARRENDATARIA con respecto a la conservación del inmueble en buenas condiciones y la entrega del mismo.<br />
                <strong>4.2.</strong> Se deja constancia que el PROPIETARIO entrega a la ARRENDATARIA las llaves de la puerta principal del ingreso al edificio, del ingreso al departamento e interiores ({c.inmueble.llaves} Llaves).
              </p>
            </div>

            {/* CLÁUSULA QUINTA */}
            <div className="space-y-2">
              <p><strong>CLÁUSULA QUINTA. – (Canon del alquiler y forma de pago). -</strong></p>
              <p className="pl-4">
                <strong>5.1.</strong> El canon mensual estipulado y convenido por las partes contratantes asciende a la suma mensual de Bs.- {c.condiciones.canonMensual} ({c.condiciones.canonLiteral}) que será cancelado por la ARRENDATARIA a favor del PROPIETARIO por cada mes de forma adelantada, monto que indiscutiblemente debe de ser cancelado desde el {c.condiciones.diaPagoInicio} de cada mes hasta el día {c.condiciones.diaPagoFin} impostergablemente, monto por el cual el PROPIETARIO extenderá su comprobante correspondiente a fin de contabilizar y validar el pago efectuado. Esto de acuerdo al Art. 14 inc. a) y e) de la Ley del Inquilinato, respecto a las obligaciones de la ARRENDATARIA y pagar puntalmente el canon de alquiler.<br />
                <strong>5.2.</strong> El canon de alquiler podrá ser cancelado en efectivo o depositado a la cuenta personal del PROPIETARIO o cuenta que sea proporcionada por el mismo, a cuyo fin se extenderá el comprobante correspondiente del mes a cancelarse.
              </p>
            </div>

            {/* CLÁUSULA SEXTA */}
            <div className="space-y-2">
              <p><strong>CLÁUSULA SEXTA. – (De la garantía). -</strong></p>
              <p className="pl-4">
                <strong>6.1.</strong> A fin de garantizar el correcto uso y mantenimiento del inmueble, activos fijos y objetos del presente contrato, la ARRENDATARIA otorgará a la suscripción del presente documento en favor del PROPIETARIO el monto de Bs. {c.condiciones.garantia}.- ({c.condiciones.garantiaLiteral}) en calidad de garantía, no pudiendo ser transferido como pago del mes de alquiler, ya que la garantía no es de la misma naturaleza que el alquiler. Dicha garantía cubre la buena conservación de la propiedad y los enseres a su cargo, por los deterioros que eventualmente pudieren sufrir y otros materiales que pudieren verificarse, ya que el propósito de la presente garantía cubre la entrega de la misma manera en la que fue habitada. Dicha garantía cubre los posibles daños ocasionados en la infraestructura al interior del departamento, ya que como se señala en la cláusula CUARTA el inmueble se entrega en perfectas condiciones de habitabilidad.<br />
                <span className="italic pl-2 block my-1">
                  Constando que se entrega en perfectas condiciones de habitabilidad; paredes estéticas a la vista, debidamente pintadas, cielo revocado y pintado; pisos de cerámica sin daño intencional provocado a excepción de un asentamiento de la infraestructura o reparación; mobiliario de los roperos empotrados correctamente funcionando; puertas de acceso debidamente pintadas, estéticas a la vista y en correcto funcionamiento; térmicos eléctricos, tomas de corriente, sockets con focos de luz, así como la iluminación perfectamente funcionando; tomas de agua, lavandería (grifos, desagües, conexiones para lavadora, área de secado) en buen funcionamiento; materiales de baño (batería de baño, inodoro, colgadores, lavamanos, ducha, box de ducha) en buen estado; los materiales de cocina perfectamente instalados (cajonería alta y baja, lavaplatos, sifones y demás), siendo que la ARRENDATARIA debe entregar el departamento a momento de su retiro en el mismo estado de su ingreso, exceptuando los deterioros y/o desgastes naturales sobrevinientes.
                </span>
                <strong>6.2.</strong> Por otro lado, también cubre el incumplimiento del pago de servicios como ser: Expensas, Agua, Luz, entre otros en el referido caso que la ARRENDATARIA se retire sin haber cancelado estos conceptos y los mismos se encontraren en mora.<br />
                <strong>6.3.</strong> Si a la permanencia de la ARRENDATARIA; al finalizar, el inmueble descrito en cláusula cuarta se encuentra en las mismas condiciones en la que fue otorgado, tanto en la infraestructura, mobiliario, servicios y demás, se procederá a devolver el monto otorgado en garantía, caso contrario se cubrirá los gastos que pudieran ocasionar la reparación de los mismos y se devolverá únicamente el saldo si es que lo hubiera, asimismo se realizarán las acciones correspondientes civiles en el fortuito caso en el que la ARRENDATARIA ejecuten deterioros mayores a la garantía, por lo que la ARRENDATARIA a momento de firmar el presente documento tiene conocimiento del mismo.
              </p>
            </div>

            {/* CLÁUSULA SÉPTIMA */}
            <div className="space-y-2">
              <p><strong>CLÁUSULA SÉPTIMA. – (Del plazo y causales de recisión de contrato). -</strong></p>
              <p className="pl-4">
                <strong>7.1.</strong> El tiempo de duración del presente contrato convenido entre partes será de UN AÑO calendario, es decir del {c.condiciones.fechaInicio}, hasta el {c.condiciones.fechaFin}; la ARRENDATARIA, sin requerimiento alguno deberá desocupar el departamento en la fecha prevista de cumplimiento de contrato ya que el presente contrato tiene plazo fatal establecido.<br />
                <strong>7.2.</strong> El presente no tendrá carácter de renovación ni de ampliación; si las partes deciden reconducir o extender el termino contractual deberá realizarse mediante un nuevo contrato suscrito o adenda.<br />
                <strong>7.3.</strong> En caso de que la ARRENDATARIA desearía resolver el presente contrato antes del cumplimiento del año, deberá comunicar al PROPIETARIO con la anticipación de 30 días, bajo pena de perder el 50% de la garantía dejada por los daños y perjuicios causados al PROPIETARIO.<br />
                <strong>7.4.</strong> Siendo que el presente contrato tiene fines de vivienda, el PROPIETARIO comunicará la resolución del presente contrato con anticipación de 30 días a fin de dar el tiempo necesario a la ARRENDATARIA de buscar otro bien inmueble, debiendo la ARRENDATARIA cancelar el ALQUILER hasta el último día habitado, sin gracia alguna.<br />
                <strong>7.5.</strong> Las causales de recisión del contrato también se delinean en base a lo Establecido en los parámetros de Desahucio, es decir, de desocupación de la ARRENDATARIA, que se encuentran estipulados de acuerdo el Art. 18 de la Ley del Inquilinato, constituyen causales de desocupación:
              </p>
              <ol className="list-[lower-alpha] pl-10 space-y-1">
                <li>Falta de pago de tres meses de alquileres vencidos, procediéndose así a la demanda civil de desalojo, misma que comprende el pago de los alquileres hasta el último día de su habitabilidad, más los daños y perjuicios a favor del PROPIETARIO, además de las costas y costos.</li>
                <li>Cuando el PROPIETARIO necesite del inmueble para vivir e instalarse en él.</li>
                <li>Cuando el PROPIETARIO tenga necesidad de hacer reconstruir en el inmueble y siempre que no se trate de meras refacciones; este extremo se justificará.</li>
                <li>Cuando el INQUILINO/A sub-alquile el inmueble o parte de él.</li>
                <li>Cuando subroga el contrato de locación, debiendo seguirse las acciones legales en este caso, tanto contra el INQUILINO/A como contra el subrogatario, es decir si la ARRENDATARIA realiza un contrato escrito o verbal con alguna otra persona y cede sus obligaciones a otra persona para que habite el bien inmueble objeto del presente contrato.</li>
                <li>Cuando se da al inmueble un uso distinto para el que fuera alquilado.</li>
                <li>Cuando el inmueble ha sido adquirido o expropiado por causa de necesidad y utilidad públicas y para beneficio de instituciones de orden social.</li>
                <li>El incumplimiento de las cláusulas estipuladas en el presente contrato.</li>
                <li>Cuando la ARRENDATARIA sin previa autorización del PROPIETARIO ingresen nuevas personas a habitar el bien inmueble objeto del presente contrato.</li>
                <li>El incumplimiento a las normas y reglamentos establecidos y puestos en conocimiento de la ARRENDATARIA.</li>
                <li>Mala conducta y/o conducta reprochable socialmente, problemas con los demás ocupantes del Edificio, violando objetivamente el sagrado derecho constitucional del VIVIR BIEN, así como también si los mismos tienen problemas Legales, Judiciales y/o policiales en el país o su país de origen que mellen la imagen del Edificio que ocupan o vaya en desmedro moral y/o social del PROPIETARIO o cualquier habitante del bien inmueble, procediéndose de manera automáticamente a la disolución-anulación-recisión del presente contrato, debiendo la ARRENDATARIA desocupar el inmueble sin requerimiento alguno, sin perjuicio de lo que establece por ley. El proceder del PROPIETARIO será que, ante cualquier contravención de la ARRENDATARIA, el PROPIETARIO hará llegar una primera amonestación de manera escrita, de acuerdo a la falta, en caso de continuar con la contravención se le comunicará la desocupación del departamento. Si la contravención fuere de una situación incorregible, se conminará a la ARRENDATARIA a la inmediata desocupación del inmueble, salvándose del derecho a iniciar acciones legales si fuere el caso.</li>
              </ol>
            </div>

            {/* CLÁUSULA OCTAVA */}
            <div className="space-y-2">
              <p><strong>CLÁUSULA OCTAVA. – (De los servicios y expensas). -</strong></p>
              <p className="pl-4">
                <strong>8.1.</strong> El servicio de energía eléctrica, la ARRENDATARIA deberá de cancelar de manera mensual en favor del PROPIETARIO la suma de Bs. {c.condiciones.luzPorPersona} por persona que habite en el departamento.<br />
                <strong>8.2.</strong> El servicio de agua potable, la ARRENDATARIA deberá de cancelar de manera mensual en favor del PROPIETARIO la suma de Bs. {c.condiciones.aguaPorPersona} por persona que habite en el departamento.<br />
                <strong>8.3.</strong> Con respecto al pago de las expensas del edificio, la ARRENDATARIA deberá cancelar de manera mensual adelantada conjuntamente con el pago del canon de alquiler la suma de Bs. {c.condiciones.expensas} misma que cubre el mantenimiento, consumo de energía eléctrica y uso del ASCENSOR, limpieza de áreas comunes, servicio de conserjería día/noche; tomando en cuenta no exceder el número de habitantes acordados al momento de su ingreso y suscripción del presente contrato. Caso contrario si es que ingresaré un nuevo habitante al inmueble, este deberá ser autorizado por el PROPIETARIO a cuya consecuencia si es que fuere, los servicios de agua, luz y expensas tendrán un incremento monetario previo acuerdo de las partes. Siendo que vivirán en el departamento una persona adulta y cuatro menores de edad, por el cual se cancelará un monto mensual de Bs. {c.condiciones.totalServicios}
              </p>
            </div>

            {/* CLÁUSULA NOVENA */}
            <p>
              <strong>CLÁUSULA NOVENA. – (De la mora). -</strong> El pago mensual de ALQUILER será por el compromiso estipulado entre ambas partes de cancelar el canon mensual de ALQUILER hasta el día 20 de cada mes de forma adelantada indiscutiblemente, la falta de pago del mes que corresponde en la fecha de su vencimiento, determinará la mora de la ARRENDATARIA y su familia en forma automática, sin necesidad de requerimiento judicial o extrajudicial siendo causal de resolución de contrato por incumplimiento, en este caso el PROPIETARIO iniciará proceso de desalojo por falta de pago, haciéndose responsable a la ARRENDATARIA del pago de las costas y costos del proceso, más los daños y perjuicios en favor del PROPIETARIO además del concepto de alquiler hasta el día de su desalojo efectivo del bien inmueble.
            </p>

            {/* CLÁUSULA DÉCIMA */}
            <div className="space-y-2">
              <p><strong>CLÁUSULA DÉCIMA. – (De los derechos, obligaciones y prohibiciones). -</strong></p>
              <div className="pl-4 space-y-2">
                <p><strong>1. Derechos del PROPIETARIO.</strong></p>
                <ul className="list-disc pl-6">
                  <li>De ser tratado con el respeto que debe caracterizar a toda persona.</li>
                  <li>De percibir el alquiler fijado mensualmente en forma tal y cual se estipula en el presente.</li>
                  <li>De recepcionar el monto concertado por régimen de expensas.</li>
                </ul>
                <p><strong>Obligaciones del PROPIETARIO.</strong></p>
                <ul className="list-disc pl-6">
                  <li>De acudir al llamado de la ARRENDATARIA a fin de solucionar problemas de deterioro natural, servicios y/o cualquier molestia justificada.</li>
                  <li>De extender su comprobante correspondiente al mes de pago del canon de ALQUILER.</li>
                </ul>

                <p><strong>2. Derechos de la ARRENDATARIA.</strong></p>
                <ul className="list-disc pl-6">
                  <li>De ser tratada con respeto de acuerdo a las normas sociales que caracteriza a toda persona.</li>
                  <li>De usar, gozar a plenitud los ambientes tanto el departamento que se cede en calidad de ALQUILER como vivienda, como las áreas comunes del edificio.</li>
                  <li>Del ingreso y salida irrestricta a cualquier hora del inmueble.</li>
                </ul>

                <p><strong>3. Obligaciones de la ARRENDATARIA.</strong></p>
                <ul className="list-disc pl-6">
                  <li>De respetar y actuar con decoro, ante el PROPIETARIO y demás habitantes del bien inmueble.</li>
                  <li>A cuidar los ambientes con el mayor de los cuidados, así como los pasillos, áreas comunes y demás instalaciones del bien inmueble para conservar la armonía y las condiciones dignas y de habitabilidad dentro del bien inmueble.</li>
                  <li>De ser cuidadosa con las llaves brindadas, cerrar las chapas de la puerta principal, por seguridad de todos los habitantes del bien inmueble.</li>
                  <li>A cancelar puntualmente y/o dentro del plazo estipulado en la presente el canon de ALQUILER acordado como los servicios de expensas, agua y luz.</li>
                </ul>

                <p><strong>PROHIBICIONES:</strong></p>
                <ul className="list-disc pl-6">
                  <li>Consumir bebidas alcohólicas en el departamento.</li>
                  <li>Realizar escándalos mediante gritos y/o peleas con familiares o demás habitantes del inmueble y/o vecinos.</li>
                  <li>A exceder con bullicio, música fuerte y organizar cualquier reunión que incomode a los demás habitantes del bien inmueble y/o el vecindario.</li>
                  <li>De igual manera la ARRENDATARIA queda prohibido/a de tener dentro del ambiente sustancias controladas u otras similares, armas de fuego u otras prohibidas por la ley, prohibida la posesión de explosivos o material peligroso o inflamatorio, en caso de tenerse conocimiento de estas situaciones y/o elementos será denunciada ante las autoridades respectivas, quedando exento de toda responsabilidad el PROPIETARIO, ya que es exclusiva responsabilidad de la ARRENDATARIA la tenencia de las sustancias prohibidas ante las autoridades policiales y judiciales, debiendo la misma de carácter indiscutible proceder al desalojo inmediato del bien inmueble.</li>
                  <li>A guardar productos dañados que expidan malos olores que sean molestos para la vecindad.</li>
                  <li>De utilizar los ambientes como otro uso que NO sea vivienda, además de sub alquilar a terceras personas, de ser este el caso, el contrato quedará resuelto automáticamente por incumplimiento de un uso distinto al estipulado en el presente contrato.</li>
                  <li>Demás prohibiciones mencionadas en el Anexo del Reglamento Interno.</li>
                </ul>
              </div>
            </div>

            {/* CLÁUSULA DÉCIMA PRIMERA */}
            <div className="space-y-2">
              <p><strong>CLÁUSULA DÉCIMA PRIMERA. – (Uso de la Vivienda - Sobre la habitabilidad y permanencia dentro del bien inmueble y Desalojo del bien inmueble). -</strong></p>
              <p className="pl-4">
                <strong>11.1.</strong> El objeto y destino que la ARRENDATARIA dará al departamento será única y exclusivamente de vivienda, no pudiendo dar uso distinto al pactado bajo sanción de recisión del presente contrato y la desocupación inmediata del bien inmueble, quedando terminantemente PROHIBIDO de ceder o subalquilar o dar en contrato de anticrético el inmueble objeto del presente contrato, ya sea este total o parcialmente, el cual pueda crear situaciones o hechos contrarios a las leyes y las buenas costumbres, siendo que por declaraciones de la ARRENDATARIA vivirán en el departamento cinco personas, vale decir la Señora MILENKA GIOVANNA ALAVIA GOMEZ y sus cuatro hijos únicamente.
              </p>
            </div>

            {/* CLÁUSULA DÉCIMA SEGUNDA */}
            <div className="space-y-2">
              <p><strong>CLÁUSULA DÉCIMA SEGUNDA. – (Del reglamento del Edificio y régimen legal). -</strong></p>
              <p className="pl-4">
                <strong>12.1.</strong> Este contrato está sujeto a las disposiciones del Código Civil en todo lo que no haya sido objeto de acuerdo expreso entre las partes contratantes.<br />
                <strong>12.2.</strong> Se adjunta a la presente como anexo el reglamento interno del Edificio a fin de que se ejecute el fiel cumplimiento por parte de la ARRENDATARIA, quien previa lectura del mismo acepta los términos y condiciones de convivencia estipulados en la misma.
              </p>
            </div>

            {/* CLÁUSULA DÉCIMA TERCERA */}
            <p>
              <strong>CLÁUSULA DÉCIMA TERCERA. – (Del consentimiento y aceptación). -</strong> Ambas partes, por un lado, LUIS GABRIEL CLAROS ARISPE en calidad de PROPIETARIO y por otro, MILENKA GIOVANNA ALAVIA GOMEZ en calidad de ARRENDATARIA, de las generales descritas en clausula primera, habiendo leído el presente documento en su integridad, manifiestan su consentimiento con cada una de las cláusulas y su aceptación, comprometiéndose a su fiel y estricto cumplimiento a lo established, por lo que firman en constancia.
            </p>

            <p className="text-right pt-4">Cochabamba, {c.fechaSuscripcion}</p>

            <div className="pt-20 grid grid-cols-2 gap-12 text-center text-xs font-bold uppercase">
              <div className="border-t border-slate-900 pt-2 space-y-1">
                <p>PROPIETARIO</p>
                <p className="font-normal text-slate-700">Nombre: {c.propietario.nombre}</p>
                <p className="font-normal text-slate-500">C.I: {c.propietario.ci}</p>
              </div>
              <div className="border-t border-slate-900 pt-2 space-y-1">
                <p>ARRENDATARIA</p>
                <p className="font-normal text-slate-700">Nombre: {c.arrendataria.nombre}</p>
                <p className="font-normal text-slate-500">C.I: {c.arrendataria.ci}</p>
              </div>
            </div>
          </article>
        )}

        {/* ================= ANEXO REGLAMENTO INTERNO COMPLETO ================= */}
        {seccionActiva === 'reglamento' && (
          <article className="space-y-4 text-xs">
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-base font-black tracking-wider uppercase">ANEXO — REGLAMENTO INTERNO DEL EDIFICIO</h1>
            </div>

            <p className="italic">
              Sra. ARRENDATARIA a tiempo de darle la bienvenida a usted y su familia, para un buen convivir de manera armoniosa tanto para usted como todos los ocupantes del Edificio, tome en cuenta el siguiente reglamento que usted ha aceptado a la firma del contrato de ALQUILER del departamento, que es de estricto cumplimiento:
            </p>

            <div className="space-y-2">
              <h3 className="font-bold border-b border-slate-200 pb-1 uppercase">FALTAS LEVES</h3>
              <p className="italic text-[11px] text-slate-600 mb-1">
                Son faltas leves las siguientes Prohibiciones; que de incurrir en una de ellas se hará llegar una amonestación, en caso de continuar con las mismas una notificación de advertencia y finalmente el aviso para desocupar el departamento por la persistencia.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Por favor, después de las 20:00 pm y especialmente cuando llegue de madrugada, NO HAGA RUIDO, deje dormir a sus vecinos.</li>
                <li>Si tiene la necesidad de cocinar no martille ni haga arreglos que requieran golpear o taladrar paredes.</li>
                <li>Si tiene niño(a) no corra, ni tome el departamento como centro recreativo.</li>
                <li>Utilice chinelas o pantuflas en el departamento, no tacos ni zuecos.</li>
                <li>Si oye música pasadas las 22:00 pm, use audífonos en adelante.</li>
                <li>No tire las puertas ni gavetas, ciérrelas con cuidado.</li>
                <li>No arrastre muebles ni deje caer objetos en el piso.</li>
                <li>El uso del Ascensor tiene que ser manipulado por personas adultas, no jugar ni saltar dentro del mismo.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold border-b border-slate-200 pb-1 uppercase">FALTAS MEDIAS</h3>
              <p className="italic text-[11px] text-slate-600 mb-1">
                Son faltas medias las siguientes Prohibiciones; que de incurrir en una de ellas se hará llegar una notificación de advertencia y finalmente de persistir en la actitud negativa el aviso de desocupación del inmueble.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Las llaves del departamento o exteriores son uso exclusivo de los habitantes del departamento, si se sorprende a terceras personas se decomisarán las llaves. Aun así, terceras personas hayan alquilado el departamento a favor de otras, queda terminantemente prohibido que personas ajenas al edificio ingresen con llaves propias o copias.</li>
                <li>Por razones de seguridad las visitas se identificarán en portería o administración; por lo tanto, no se deberá tomar el departamento como centros recreativos o sociales que perturben la tranquilidad de los habitantes del edificio, sobre todo por las noches.</li>
                <li>Dejar abierta la puerta de calle bajo ninguna circunstancia, de ocurrir pérdidas, extravíos o similares se cargará toda la responsabilidad a las personas identificadas, sean habitantes o personas visitantes del departamento.</li>
                <li>Dejar ingresar personas desconocidas al edificio bajo ningún motivo, estas podrían ser ladrones, personas no gratas o personas no bien recibidas para los vecinos.</li>
                <li>Arrojar objetos o desperdicios de cualquier especie y volumen por las ventanas o gradas (basura, grasa, colillas de cigarros, etc.)</li>
                <li>Dejar basura dentro/fuera del departamento y áreas comunes como ser: ascensor, pasillos, gradas, garaje, etc.</li>
                <li>Botar o echar materiales a los desagües (cocina, baños) pues estos se obstruyen (comidas, líquidos corrosivos)</li>
                <li>Realizar fiestas, juntas religiosas o cualquier acontecimiento que perturbe la tranquilidad de los demás.</li>
                <li>Ingresar vehículos (autos, motos, bicicletas) de personas externas no autorizadas al edificio.</li>
                <li>Tener cualquier tipo de mascotas o animales como: perros, gatos, aves, conejos u otros.</li>
                <li>Botar basura en la calle, la misma tiene multa por la junta de vecinos de la zona (OTB) y/o EMSA.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold border-b border-slate-200 pb-1 uppercase">FALTAS GRAVES</h3>
              <p className="italic text-[11px] text-slate-600 mb-1">
                Constituyen faltas graves las siguientes Prohibiciones; de incurrir en una de ellas, la ARRENDATARIA previo aviso de la parte propietaria o administración deberá desocupar el departamento.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>El Departamento es uso exclusivo de vivienda, queda terminantemente prohibido ser utilizado como fábrica, oficina, negocio, hotel y otras derivaciones.</li>
                <li>Tomar el departamento o habitaciones como centro de citas nocturnas, damas de compañía para trabajos sexuales u otros similares de cualquier género.</li>
                <li>Consumir o distribuir sustancias controladas como ser: marihuana, cocaína, heroína, etc. Caso contrario se realizará la denuncia correspondiente.</li>
                <li>Queda totalmente prohibido hacer velatorios dentro del departamento o edificio.</li>
                <li>Hacer escándalos como riñas y peleas, sea en parejas, familiares o con visitas.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="font-bold uppercase">TOMAR EN CUENTA QUE:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Se debe Informar en administración o conserjería cualquier desperfecto que ocurriera dentro del departamento como ser: plomería, carpintería, albañilería, electricidad u otros.</li>
                <li>Informar en administración o conserjería cualquier instalación particular como: teléfono, internet, tv cable, u otros.</li>
                <li>Leer y tomar en cuenta las RECOMENDACIONES señaladas en la parte central de los baños del departamento. (En caso de omitir la información sobre estos tres aspectos anteriormente mencionados, la ARRENDATARIA deberá responder por los daños ocasionados a la infraestructura)</li>
                <li>En parte visible de la planta baja, se colocará un pizarrón, en el que se exhibirán comunicados y notas de interés común de todas las personas que habitan en el edificio.</li>
                <li>El edificio cuenta con cámaras de seguridad en todas las áreas comunes como ser: ascensor, gradas, pasillos, garaje, etc.</li>
              </ul>
              <p className="font-bold text-center pt-2">Aprendamos a convivir en edificio, respetemos el derecho y la tranquilidad de las demás personas.</p>
            </div>

            <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs font-bold uppercase">
              <div className="border-t border-slate-900 pt-2"><p>LA ADMINISTRACIÓN</p></div>
              <div className="border-t border-slate-900 pt-2"><p>ARRENDATARIA</p></div>
            </div>
          </article>
        )}

      </div>
    </div>
  );
}