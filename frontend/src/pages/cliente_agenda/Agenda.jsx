import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopoMobile from '../../components/layout/TopoMobile';
import Modal from '../../components/ui/Modal';
import useDados from '../../hooks/useDados';
import { cancelarAgendamento, listarAgendamentos } from '../../services/agendamentosService';
import { formatarDataHora, formatarMoeda } from '../../utils/formatters';
import { ROTAS } from '../../constants/rotas';
import './Agenda.css';

/** Divide a data UTC em "12" e "NOV" para o quadradinho de data (fuso local - RNF07) */
function partesDaData(inicioUtc) {
    const data = new Date(inicioUtc);
    return {
        dia: data.getDate(),
        mes: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(data).replace('.', '').toUpperCase(),
    };
}

function SeloPagamento({ pagamento, tipo }) {
    if (pagamento === 'online') return <span className="selo selo-amarelo">Pago online</span>;
    return <span className="selo">{tipo === 'entrega' ? 'Pagar na entrega' : 'Pagar no local'}</span>;
}

/** Situação de um agendamento já passado: Concluído, Cancelado ou Faltou */
const STATUS_ANTERIOR = {
    concluido: { rotulo: 'Concluído', classe: 'selo' },
    cancelado: { rotulo: 'Cancelado', classe: 'selo selo-tinta' },
    faltou: { rotulo: 'Faltou', classe: 'selo selo-amarelo' },
};

function SeloStatus({ status }) {
    const info = STATUS_ANTERIOR[status];
    return info ? <span className={info.classe}>{info.rotulo}</span> : null;
}

/** Linha vazia (sem dados do backend) */
function LinhaVazia() {
    return (
        <li className="agenda-linha vazia">
            <span className="esqueleto agenda-data-vazia" />
            <span className="agenda-texto">
                <span className="esqueleto" style={{ width: 170, height: 16 }} />
                <span className="esqueleto" style={{ width: 120, height: 12 }} />
            </span>
            <span className="esqueleto" style={{ width: 80, height: 22, borderRadius: 999 }} />
        </li>
    );
}

/**
 * Agenda do cliente (RF08, RF13): próximos agendamentos e histórico.
 * BACKEND: agendamentosService.listarAgendamentos() -> { proximos, anteriores }
 */
function Agenda() {
    const navigate = useNavigate();
    const { dados, carregando, erro, recarregar } = useDados(listarAgendamentos, [], { proximos: [], anteriores: [] });
    const [cancelando, setCancelando] = useState(null);
    const [erroCancelar, setErroCancelar] = useState('');

    const proximos = dados?.proximos || [];
    const anteriores = dados?.anteriores || [];
    const destaque = proximos[0];

    const remarcar = (ag) => navigate(ROTAS.AGENDAR(ag.negocioId));

    const confirmarCancelamento = async () => {
        try {
            await cancelarAgendamento(cancelando.id);
            setCancelando(null);
            recarregar();
        } catch {
            setErroCancelar('Não foi possível cancelar agora. Tente novamente.');
        }
    };

    return (
        <>
            <TopoMobile titulo="Agenda" />

            <div className={`pagina ${carregando ? 'carregando' : ''}`}>
                <div className="pagina-principal">
                    <h1 className="pagina-titulo agenda-titulo">Seus agendamentos</h1>

                    {erro && (
                        <div className="aviso-erro" role="alert">
                            Não foi possível carregar sua agenda.{' '}
                            <button type="button" className="link-roxo" onClick={recarregar}>Tentar novamente</button>
                        </div>
                    )}

                    <ul className="agenda-lista">
                        {proximos.length === 0 && <><LinhaVazia /><LinhaVazia /></>}
                        {proximos.map((ag) => {
                            const { dia, mes } = partesDaData(ag.inicioUtc);
                            return (
                                <li key={ag.id} className="agenda-linha">
                                    <span className="agenda-data"><strong>{dia}</strong><small>{mes}</small></span>
                                    <span className="agenda-texto">
                                        <strong>{ag.titulo}</strong>
                                        <span>{ag.negocioNome} · {formatarDataHora(ag.inicioUtc, { hour: '2-digit', minute: '2-digit' })}</span>
                                    </span>
                                    <SeloPagamento pagamento={ag.pagamento} tipo={ag.tipo} />
                                    <span className="agenda-acoes">
                                        {ag.tipo === 'entrega'
                                            ? <button type="button" className="btn btn-contorno forte btn-pequeno" onClick={() => navigate(ROTAS.CONVERSAS)}>Conversar</button>
                                            : <button type="button" className="btn btn-contorno forte btn-pequeno" onClick={() => remarcar(ag)}>Remarcar</button>}
                                        <button type="button" className="btn btn-primario btn-pequeno" onClick={() => navigate(ROTAS.ESTABELECIMENTO(ag.negocioId))}>Ver provedor</button>
                                        <button type="button" className="link-roxo agenda-cancelar" onClick={() => { setErroCancelar(''); setCancelando(ag); }}>Cancelar</button>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>

                    <h2 className="agenda-subtitulo">Anteriores</h2>
                    <ul className="agenda-lista">
                        {anteriores.length === 0 && <LinhaVazia />}
                        {anteriores.map((ag) => (
                            <li key={ag.id} className="agenda-linha anterior">
                                <span className="agenda-texto">
                                    <strong>{ag.titulo}</strong>
                                    <span>{ag.negocioNome} · {formatarDataHora(ag.inicioUtc, { day: '2-digit', month: 'short' })} · {formatarMoeda(ag.valor)}</span>
                                </span>
                                <SeloStatus status={ag.status} />
                                <span className="agenda-acoes">
                                    <button type="button" className="btn btn-contorno forte btn-pequeno" onClick={() => navigate(ROTAS.ESTABELECIMENTO(ag.negocioId))}>Agendar de novo</button>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <aside className="pagina-lateral agenda-lateral">
                    <section className="agenda-proximo">
                        <span className="selo selo-amarelo">Próximo horário</span>
                        {destaque ? (
                            <>
                                <h2>{destaque.titulo}</h2>
                                <p>{formatarDataHora(destaque.inicioUtc)}</p>
                                <small>{destaque.negocioNome} · {destaque.pagamento === 'online' ? 'pago pelo STIZY' : 'pagamento no local'}</small>
                                <button type="button" className="btn btn-amarelo btn-bloco" onClick={() => remarcar(destaque)}>Remarcar</button>
                            </>
                        ) : (
                            <>
                                <span className="esqueleto agenda-proximo-vazio" style={{ width: '70%', height: 22 }} />
                                <span className="esqueleto agenda-proximo-vazio" style={{ width: '50%', height: 14 }} />
                                <span className="esqueleto agenda-proximo-vazio" style={{ width: '80%', height: 12 }} />
                                <button type="button" className="btn btn-amarelo btn-bloco" disabled>Remarcar</button>
                            </>
                        )}
                    </section>
                </aside>
            </div>

            {/* Modal de confirmação (o Figma usa modal para cancelar) */}
            <Modal aberto={!!cancelando} onFechar={() => setCancelando(null)} titulo="Cancelar agendamento?">
                <p className="modal-texto">
                    {cancelando?.titulo} · {cancelando?.negocioNome}. O horário volta a ficar livre para outros clientes.
                </p>
                {erroCancelar && <p className="campo-erro" role="alert">{erroCancelar}</p>}
                <div className="modal-acoes">
                    <button type="button" className="btn btn-contorno" onClick={() => setCancelando(null)}>Manter</button>
                    <button type="button" className="btn btn-escuro" onClick={confirmarCancelamento}>Cancelar horário</button>
                </div>
            </Modal>
        </>
    );
}

export default Agenda;
