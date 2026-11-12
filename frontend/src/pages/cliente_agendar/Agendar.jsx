import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Scissors } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import Passos from '../../components/ui/Passos';
import Resumo, { LinhaResumo } from '../../components/ui/Resumo';
import useDados from '../../hooks/useDados';
import { usePedido } from '../../context/PedidoContext';
import { listarHorarios } from '../../services/negociosService';
import { formatarMoeda, proximosSeteDias, rotuloDiaCurto } from '../../utils/formatters';
import { ROTAS } from '../../constants/rotas';
import './Agendar.css';

const QUANTIDADE_VAZIOS = 10;

/**
 * Passo 2 do agendamento: escolher o dia e o horário (RF05).
 * Rota: /agendar/:id
 *
 * - 7 dias a partir de hoje (calculados no navegador)
 * - Horários: BACKEND devolve só o que importa; livre=false aparece riscado (RF07)
 *   negociosService.listarHorarios(negocioId, data, servicoId) -> { hora, livre }[]
 */
function Agendar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { pedido, atualizarPedido } = usePedido();

    const dias = useMemo(() => proximosSeteDias(), []);
    const [diaIso, setDiaIso] = useState(dias[0].iso);
    const [horaEscolhida, setHoraEscolhida] = useState(null);

    const servico = pedido.itens?.[0];
    const diaAtual = dias.find((d) => d.iso === diaIso);

    const { dados, carregando, erro, recarregar } = useDados(
        () => listarHorarios(id, diaIso, servico?.id),
        [id, diaIso, servico?.id],
        [],
    );

    // Sem dados: horários vazios ("--:--") para mostrar a grade
    const reais = dados || [];
    const horarios = reais.length > 0
        ? reais
        : Array.from({ length: QUANTIDADE_VAZIOS }, (_, i) => ({ hora: `vazio-${i}`, livre: true, vazio: true }));

    const escolherDia = (iso) => { setDiaIso(iso); setHoraEscolhida(null); };

    const irParaPagamento = () => {
        atualizarPedido({ dia: diaIso, diaRotulo: rotuloDiaCurto(diaAtual.data), horario: horaEscolhida });
        navigate(ROTAS.PAGAMENTO);
    };

    const horaTexto = horaEscolhida && !String(horaEscolhida).startsWith('vazio') ? horaEscolhida : '--:--';
    const dataHora = horaEscolhida ? `${rotuloDiaCurto(diaAtual.data)} · ${horaTexto}` : 'Escolha um horário';
    const total = servico?.preco != null ? formatarMoeda(servico.preco) : formatarMoeda(0);

    return (
        <>
            <TopoMobile titulo="Escolher horário" voltar />

            <div className="pagina com-barra">
                <div className="pagina-principal">
                    <div className="agendar-topo">
                        <button type="button" className="voltar-link" onClick={() => navigate(-1)}>
                            <ChevronLeft size={20} /> Voltar
                        </button>
                        <Passos atual={2} />
                    </div>
                    <div className="so-mobile"><Passos atual={2} /></div>

                    {servico && (
                        <p className="agendar-servico so-mobile">
                            <Scissors size={16} />
                            {servico.vazio ? 'Serviço escolhido' : `${servico.nome} · ${servico.duracaoMin} min · ${formatarMoeda(servico.preco)}`}
                        </p>
                    )}

                    <h1 className="pagina-titulo agendar-titulo">
                        <span className="so-desktop">Escolha o dia e o horário</span>
                        <span className="so-mobile">Escolha o dia</span>
                    </h1>

                    <div className="dias" role="radiogroup" aria-label="Dia do atendimento">
                        {dias.map((d) => (
                            <button key={d.iso} type="button" role="radio" aria-checked={d.iso === diaIso}
                                className={`dia ${d.iso === diaIso ? 'ativo' : ''}`} onClick={() => escolherDia(d.iso)}>
                                <span>{d.diaSemana}</span>
                                <strong>{d.dia}</strong>
                            </button>
                        ))}
                    </div>

                    <div className="horarios-topo">
                        <h2>Horários livres <span className="so-desktop">· {rotuloDiaCurto(diaAtual.data)}</span></h2>
                        <span className="horarios-legenda so-desktop">Riscado = ocupado</span>
                        <span className="horarios-legenda so-mobile">{rotuloDiaCurto(diaAtual.data)}</span>
                    </div>

                    {erro && (
                        <div className="aviso-erro" role="alert">
                            Não foi possível carregar os horários.{' '}
                            <button type="button" className="link-roxo" onClick={recarregar}>Tentar novamente</button>
                        </div>
                    )}

                    <div className={`horarios ${carregando ? 'carregando' : ''}`} role="radiogroup" aria-label="Horários livres">
                        {horarios.map((h) => {
                            const ativo = horaEscolhida === h.hora;
                            return (
                                <button key={h.hora} type="button" role="radio" aria-checked={ativo} disabled={!h.livre}
                                    className={`horario ${ativo ? 'ativo' : ''} ${h.livre ? '' : 'ocupado'}`}
                                    onClick={() => setHoraEscolhida(h.hora)}>
                                    {h.vazio ? '--:--' : h.hora}
                                </button>
                            );
                        })}
                    </div>

                    <p className="horarios-aviso so-mobile">Riscado = horário já ocupado (bloqueado automaticamente).</p>
                </div>

                <div className="pagina-lateral">
                    <Resumo
                        titulo="Resumo"
                        total={total}
                        legendaMobile={dataHora}
                        botao={<button type="button" className="btn btn-primario" disabled={!horaEscolhida} onClick={irParaPagamento}>Ir para o pagamento</button>}
                    >
                        <LinhaResumo rotulo="Serviço" valor={servico && !servico.vazio ? servico.nome : '—'} />
                        <LinhaResumo rotulo="Profissional" valor={pedido.negocio?.nome || '—'} />
                        <LinhaResumo rotulo="Data e hora" valor={horaEscolhida ? dataHora : '—'} />
                    </Resumo>
                </div>
            </div>
        </>
    );
}

export default Agendar;
