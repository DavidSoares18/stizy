import { useState } from 'react';
import { Check, CreditCard } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import Abas from '../../components/ui/Abas';
import Modal from '../../components/ui/Modal';
import useDados from '../../hooks/useDados';
import { obterFolha, pagarTaxa } from '../../services/provedorService';
import { formatarDataHora, formatarMoeda, mesPorExtenso } from '../../utils/formatters';
import './ProvedorFolha.css';

const PERIODOS = [
    { id: 'dia', rotulo: 'Dia' },
    { id: 'mes', rotulo: 'Mês' },
    { id: 'ano', rotulo: 'Ano' },
];
const GANHOS_ROTULO = { dia: 'Ganhos do dia', mes: 'Ganhos do mês', ano: 'Ganhos do ano' };

/** Valor monetário ou barra cinza enquanto o backend não preenche */
const Valor = ({ valor, className = '' }) =>
    (valor == null ? <span className={`esqueleto valor-vazio ${className}`} /> : <strong className={className}>{formatarMoeda(valor)}</strong>);

/**
 * Folha de pagamento do provedor (RF15 relatório + RF18 taxa de 8%).
 * BACKEND: provedorService.obterFolha(periodo) devolve:
 *   { referenciaTitulo, ganhos, taxaStizy, liquido, porServico[], porFormaPagamento{online,presencial},
 *     taxa{ valor, vencimento (UTC), paga } }
 * A taxa de 8% é calculada pelo SERVIDOR; o front só exibe.
 */
function ProvedorFolha() {
    const [periodo, setPeriodo] = useState('mes');
    const { dados: folha, carregando, erro, recarregar } = useDados(() => obterFolha(periodo), [periodo], null);

    const [modal, setModal] = useState(null); // 'pagar' | 'paga'
    const [pagando, setPagando] = useState(false);
    const [erroPagar, setErroPagar] = useState('');

    const referencia = folha?.referenciaTitulo || mesPorExtenso(new Date());
    const taxa = folha?.taxa;
    const vencimento = taxa?.vencimento ? formatarDataHora(taxa.vencimento, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

    const pagar = async () => {
        setPagando(true);
        setErroPagar('');
        try {
            await pagarTaxa(referencia);
            setModal('paga');
            recarregar();
        } catch {
            setErroPagar('Não foi possível pagar agora. Tente novamente.');
        } finally {
            setPagando(false);
        }
    };

    const servicos = folha?.porServico || [];

    return (
        <>
            <TopoMobile titulo="Folha de pagamento" />

            <div className={`pagina ${carregando ? 'carregando' : ''}`}>
                <div className="pagina-principal folha-principal">
                    <header className="folha-topo">
                        <h1 className="pagina-titulo folha-titulo">
                            <span className="so-desktop">Folha de {referencia}</span>
                            <span className="so-mobile">{referencia.charAt(0).toUpperCase() + referencia.slice(1)}</span>
                        </h1>
                        <Abas abas={PERIODOS} ativa={periodo} onMudar={setPeriodo} rotulo="Período da folha" />
                    </header>

                    {erro && (
                        <div className="aviso-erro" role="alert">
                            Não foi possível carregar a folha.{' '}
                            <button type="button" className="link-roxo" onClick={recarregar}>Tentar novamente</button>
                        </div>
                    )}

                    <div className="folha-totais">
                        <div className="folha-total"><span>{GANHOS_ROTULO[periodo]}</span><Valor valor={folha?.ganhos} /></div>
                        <div className="folha-total"><span>Taxa STIZY (8%)</span><Valor valor={folha?.taxaStizy} /></div>
                        <div className="folha-total destaque"><span>Líquido para você</span><Valor valor={folha?.liquido} /></div>
                    </div>

                    <div className="folha-detalhes">
                        <section className="folha-bloco cinza">
                            <h2>Faturamento por serviço</h2>
                            {servicos.length === 0 ? (
                                [0, 1, 2].map((n) => (
                                    <div key={n} className="folha-linha"><span className="esqueleto" style={{ width: 150, height: 14 }} /><span className="esqueleto" style={{ width: 70, height: 14 }} /></div>
                                ))
                            ) : servicos.map((s) => (
                                <div key={s.nome} className="folha-linha">
                                    <span>{s.nome}{s.atendimentos != null && ` · ${s.atendimentos} atend.`}</span>
                                    <strong>{formatarMoeda(s.valor)}</strong>
                                </div>
                            ))}
                        </section>

                        <section className="folha-bloco">
                            <h2>Forma de pagamento</h2>
                            <div className="folha-linha"><span>Online (STIZY)</span><Valor valor={folha?.porFormaPagamento?.online} /></div>
                            <div className="folha-linha"><span>Presencial</span><Valor valor={folha?.porFormaPagamento?.presencial} /></div>
                        </section>
                    </div>
                </div>

                <aside className="pagina-lateral folha-lateral">
                    <section className="folha-taxa">
                        <span className="selo selo-amarelo">Vence em {vencimento}</span>
                        <p className="folha-taxa-rotulo">Taxa a pagar à STIZY</p>
                        {taxa?.valor != null ? <strong className="folha-taxa-valor">{formatarMoeda(taxa.valor)}</strong> : <span className="esqueleto folha-taxa-vazia" />}
                        <small>
                            8% sobre os ganhos totais do mês{folha?.ganhos != null && ` (${formatarMoeda(folha.ganhos)})`}, calculado e registrado no fechamento mensal.
                        </small>
                        <button type="button" className="btn btn-amarelo btn-bloco" disabled={!!taxa?.paga}
                            onClick={() => { setErroPagar(''); setModal('pagar'); }}>
                            <CreditCard size={18} /> {taxa?.paga ? 'Taxa paga' : 'Pagar taxa'}
                        </button>
                    </section>
                </aside>
            </div>

            {/* Modal: pagar taxa */}
            <Modal aberto={modal === 'pagar'} onFechar={() => setModal(null)} titulo="Pagar taxa da STIZY">
                <dl className="folha-modal-dados">
                    <div><dt>Referência:</dt><dd>{referencia}</dd></div>
                    <div><dt>Ganhos do mês:</dt><dd>{folha?.ganhos != null ? formatarMoeda(folha.ganhos) : '—'}</dd></div>
                    <div><dt>Taxa de 8%:</dt><dd>{taxa?.valor != null ? formatarMoeda(taxa.valor) : '—'}</dd></div>
                    <div><dt>Vencimento:</dt><dd>{vencimento}</dd></div>
                </dl>
                {erroPagar && <p className="campo-erro" role="alert">{erroPagar}</p>}
                <div className="modal-acoes">
                    <button type="button" className="btn btn-contorno" onClick={() => setModal(null)}>Cancelar</button>
                    <button type="button" className="btn btn-primario" onClick={pagar} disabled={pagando}>
                        {pagando ? 'Pagando...' : `Pagar ${taxa?.valor != null ? formatarMoeda(taxa.valor) : ''}`.trim()}
                    </button>
                </div>
            </Modal>

            {/* Modal: taxa paga */}
            <Modal aberto={modal === 'paga'} onFechar={() => setModal(null)} titulo="Taxa paga!" icone={<Check />} corIcone="roxo">
                <p className="modal-texto centro">
                    Recebemos {taxa?.valor != null ? formatarMoeda(taxa.valor) : 'o valor'} referentes a {referencia}.
                </p>
                <div className="modal-acoes">
                    <button type="button" className="btn btn-primario" onClick={() => setModal(null)}>OK</button>
                </div>
            </Modal>
        </>
    );
}

export default ProvedorFolha;
