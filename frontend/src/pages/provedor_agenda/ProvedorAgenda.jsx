import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import Modal from '../../components/ui/Modal';
import useDados from '../../hooks/useDados';
import { bloquearHorario, concluirAtendimento, marcarFalta, obterAgendaDoDia, registrarAusencia } from '../../services/provedorService';
import { formatarMoeda, rotuloDiaCurto, tituloDiaAgenda } from '../../utils/formatters';
import './ProvedorAgenda.css';

const AGENDA_VAZIA = { resumo: { atendimentos: null, horariosLivres: null, previsto: null }, proximo: null, horarios: [] };
const LINHAS_VAZIAS = 8;

/** AAAA-MM-DD no fuso local (sem passar por UTC) */
const paraIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Selo do tipo de pagamento de um atendimento */
function SeloPagamento({ pagamento }) {
    return pagamento === 'online'
        ? <span className="selo selo-amarelo">Pago online</span>
        : <span className="selo">No local</span>;
}

/** Número do resumo: mostra "—" enquanto o backend não preencher */
const Numero = ({ valor, formatar }) => (valor == null ? <span className="esqueleto numero-vazio" /> : <strong>{formatar ? formatar(valor) : valor}</strong>);

/**
 * Agenda do provedor (RF06): horários livres e preenchidos do dia, com o cliente de cada um.
 * BACKEND: provedorService.obterAgendaDoDia(data) -> { resumo, proximo, horarios[] } (veja o serviço).
 */
function ProvedorAgenda() {
    const [data, setData] = useState(() => new Date());
    const dataIso = paraIso(data);

    const { dados, carregando, erro, recarregar } = useDados(() => obterAgendaDoDia(dataIso), [dataIso], AGENDA_VAZIA);
    const agenda = dados || AGENDA_VAZIA;

    const [atendimento, setAtendimento] = useState(null);
    const [ausenciaAberta, setAusenciaAberta] = useState(false);
    const [erroAcao, setErroAcao] = useState('');

    const mudarDia = (delta) => setData((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta));

    // Sem dados: linhas vazias para mostrar a grade
    const linhas = agenda.horarios.length > 0
        ? agenda.horarios
        : Array.from({ length: LINHAS_VAZIAS }, (_, i) => ({ hora: `vazio-${i}`, vazio: true }));

    const bloquear = async (hora) => {
        setErroAcao('');
        try {
            await bloquearHorario(dataIso, hora);
            recarregar();
        } catch {
            setErroAcao('Não foi possível bloquear o horário. Tente novamente.');
        }
    };

    const concluir = async () => {
        setErroAcao('');
        try {
            await concluirAtendimento(atendimento.agendamentoId);
            setAtendimento(null);
            recarregar();
        } catch {
            setErroAcao('Não foi possível concluir o atendimento. Tente novamente.');
        }
    };

    const registrarFalta = async () => {
        setErroAcao('');
        try {
            await marcarFalta(atendimento.agendamentoId);
            setAtendimento(null);
            recarregar();
        } catch {
            setErroAcao('Não foi possível registrar a falta. Tente novamente.');
        }
    };

    const { resumo, proximo } = agenda;

    return (
        <>
            <TopoMobile variante="home" />

            <div className={`pagina ${carregando ? 'carregando' : ''}`}>
                <div className="pagina-principal">
                    <header className="agenda-prov-topo">
                        <h1 className="pagina-titulo agenda-prov-titulo">
                            <span className="so-desktop">{tituloDiaAgenda(data)}</span>
                            <span className="so-mobile">{`${data.toDateString() === new Date().toDateString() ? 'Hoje · ' : ''}${rotuloDiaCurto(data)}`}</span>
                        </h1>
                        <div className="agenda-prov-setas">
                            <button type="button" className="icone-botao" onClick={() => mudarDia(-1)} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
                            <button type="button" className="icone-botao" onClick={() => mudarDia(1)} aria-label="Próximo dia"><ChevronRight size={20} /></button>
                        </div>
                    </header>

                    {/* Resumo em 3 blocos (só mobile) */}
                    <div className="agenda-prov-stats so-mobile">
                        <div><Numero valor={resumo.atendimentos} /><span>atendimentos</span></div>
                        <div><Numero valor={resumo.horariosLivres} /><span>horários livres</span></div>
                        <div><Numero valor={resumo.previsto} formatar={formatarMoeda} /><span>previstos</span></div>
                    </div>

                    {erro && (
                        <div className="aviso-erro" role="alert">
                            Não foi possível carregar a agenda.{' '}
                            <button type="button" className="link-roxo" onClick={recarregar}>Tentar novamente</button>
                        </div>
                    )}
                    {erroAcao && <p className="campo-erro" role="alert">{erroAcao}</p>}

                    <ul className="agenda-prov-lista">
                        {linhas.map((h) => {
                            const livre = h.vazio ? false : h.livre;
                            return (
                                <li key={h.hora} className={`agenda-prov-linha ${livre ? 'livre' : ''} ${h.vazio ? 'vazia' : ''}`}>
                                    {h.vazio ? (
                                        <>
                                            <span className="esqueleto" style={{ width: 52, height: 18 }} />
                                            <span className="agenda-prov-info">
                                                <span className="esqueleto" style={{ width: 150, height: 14 }} />
                                                <span className="esqueleto" style={{ width: 90, height: 12 }} />
                                            </span>
                                            <span className="esqueleto" style={{ width: 84, height: 24, borderRadius: 999 }} />
                                        </>
                                    ) : livre ? (
                                        <>
                                            <strong className="agenda-prov-hora">{h.hora}</strong>
                                            <span className="agenda-prov-info livre-texto">Horário livre</span>
                                            <button type="button" className="btn btn-contorno btn-pequeno" onClick={() => bloquear(h.hora)}>Bloquear</button>
                                        </>
                                    ) : (
                                        <button type="button" className="agenda-prov-ocupado" onClick={() => setAtendimento(h)}>
                                            <strong className="agenda-prov-hora">{h.hora}</strong>
                                            <span className="agenda-prov-info">
                                                <strong>{h.servico}</strong>
                                                <span>{h.clienteNome}</span>
                                            </span>
                                            <SeloPagamento pagamento={h.pagamento} />
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    <button type="button" className="btn btn-contorno forte so-mobile" onClick={() => setAusenciaAberta(true)}>
                        <Calendar size={18} /> Registrar ausência ou férias
                    </button>
                </div>

                <aside className="pagina-lateral so-desktop">
                    <section className="agenda-prov-resumo">
                        <h2>Resumo do dia</h2>
                        <div><span>Atendimentos</span><Numero valor={resumo.atendimentos} /></div>
                        <div><span>Horários livres</span><Numero valor={resumo.horariosLivres} /></div>
                        <div><span>Previsto</span><Numero valor={resumo.previsto} formatar={formatarMoeda} /></div>
                    </section>

                    <section className="agenda-prov-proximo">
                        <span className="selo selo-amarelo">PRÓXIMO</span>
                        {proximo ? (
                            <>
                                <h2>{proximo.clienteNome} · {proximo.hora}</h2>
                                <p>{proximo.servico} · {proximo.pagamento === 'online' ? 'Pago online' : 'No local'}</p>
                            </>
                        ) : (
                            <>
                                <span className="esqueleto" style={{ width: '70%', height: 20 }} />
                                <span className="esqueleto" style={{ width: '55%', height: 13 }} />
                            </>
                        )}
                    </section>

                    <button type="button" className="btn btn-contorno forte btn-bloco" onClick={() => setAusenciaAberta(true)}>
                        <Calendar size={18} /> Registrar ausência ou férias
                    </button>
                </aside>
            </div>

            {/* Modal: detalhes do atendimento */}
            <Modal aberto={!!atendimento} onFechar={() => setAtendimento(null)} titulo="Detalhes do atendimento">
                <dl className="detalhes">
                    <div><dt>Cliente</dt><dd>{atendimento?.clienteNome}</dd></div>
                    <div><dt>Serviço</dt><dd>{atendimento?.servico}</dd></div>
                    <div><dt>Horário</dt><dd>{atendimento?.hora}</dd></div>
                    <div><dt>Pagamento</dt><dd>{atendimento?.pagamento === 'online' ? 'Pago online' : 'No local'}</dd></div>
                    <div><dt>Valor</dt><dd>{atendimento?.valor != null ? formatarMoeda(atendimento.valor) : '—'}</dd></div>
                </dl>
                <div className="modal-acoes">
                    <button type="button" className="btn btn-contorno" onClick={() => setAtendimento(null)}>Fechar</button>
                    <button type="button" className="btn btn-contorno forte" onClick={registrarFalta}>Cliente faltou</button>
                    <button type="button" className="btn btn-primario" onClick={concluir}>Concluir atendimento</button>
                </div>
            </Modal>

            {/* Modal: ausência ou férias (RF14). Renderizado só quando aberto para limpar o formulário */}
            {ausenciaAberta && <ModalAusencia onFechar={() => setAusenciaAberta(false)} />}
        </>
    );
}

/** Modal "Registrar ausência ou férias": bloqueia a agenda no período (RF14) */
function ModalAusencia({ onFechar }) {
    const [inicio, setInicio] = useState('');
    const [fim, setFim] = useState('');
    const [motivo, setMotivo] = useState('');
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);

    const registrar = async (e) => {
        e.preventDefault();
        if (!inicio || !fim) { setErro('Informe a data de início e a de término.'); return; }
        if (fim < inicio) { setErro('A data de término deve ser igual ou depois do início.'); return; }
        setSalvando(true);
        try {
            await registrarAusencia({ inicio, fim, motivo: motivo.trim() || null });
            onFechar();
        } catch {
            setErro('Não foi possível registrar agora. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal aberto onFechar={onFechar} titulo="Registrar ausência ou férias">
            <form className="modal-form" onSubmit={registrar} noValidate>
                <div className="campo">
                    <span className="campo-rotulo">Período</span>
                    <div className="periodo-datas">
                        <input type="date" value={inicio} onChange={(e) => { setInicio(e.target.value); setErro(''); }} aria-label="Data de início" />
                        <input type="date" value={fim} min={inicio} onChange={(e) => { setFim(e.target.value); setErro(''); }} aria-label="Data de término" />
                    </div>
                </div>
                <div className="campo">
                    <label htmlFor="ausencia-motivo">Motivo (opcional)</label>
                    <input id="ausencia-motivo" value={motivo} placeholder="Ex.: Férias" onChange={(e) => setMotivo(e.target.value)} />
                </div>
                <p className="caixa-aviso"><Info size={16} /> Os horários desse período ficam bloqueados para novos agendamentos.</p>
                {erro && <p className="campo-erro" role="alert">{erro}</p>}
                <div className="modal-acoes">
                    <button type="button" className="btn btn-contorno" onClick={onFechar}>Cancelar</button>
                    <button type="submit" className="btn btn-primario" disabled={salvando}>{salvando ? 'Registrando...' : 'Registrar'}</button>
                </div>
            </form>
        </Modal>
    );
}

export default ProvedorAgenda;
