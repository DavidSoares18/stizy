import { Check, Clock } from 'lucide-react';
import { formatarMoeda } from '../../utils/formatters';

/**
 * Lista de serviços do negócio.
 *
 * modo="horario"  : serviço com duração e preço fixos; escolhe UM (RF03, RF05).
 * modo="combinar" : "A combinar"; pode escolher VÁRIOS e solicitar pelo WhatsApp (RF16).
 *
 * "itens" já vem pronto da página: serviços reais do backend ou placeholders vazios
 * ({ id: 'vazio-0', vazio: true }) enquanto não houver dados.
 * Formato real: { id, nome, duracaoMin, preco, aCombinar, semHorario }
 */
function ListaServicos({ itens, modo, selecionados, onAlternar }) {
    return (
        <ul className="servicos-lista" role={modo === 'horario' ? 'radiogroup' : 'group'} aria-label="Serviços">
            {itens.map((item) => {
                const ativo = selecionados.includes(item.id);
                return (
                    <li key={item.id}>
                        <button
                            type="button"
                            className={`servico-linha ${ativo ? 'ativo' : ''} ${item.vazio ? 'vazio' : ''}`}
                            role={modo === 'horario' ? 'radio' : 'checkbox'}
                            aria-checked={ativo}
                            onClick={() => onAlternar(item.id)}
                        >
                            <span className="servico-texto">
                                {item.vazio ? (
                                    <>
                                        <span className="esqueleto" style={{ width: 180, height: 16 }} />
                                        <span className="esqueleto" style={{ width: 90, height: 12 }} />
                                    </>
                                ) : (
                                    <>
                                        <strong>{item.nome}</strong>
                                        <span className="servico-duracao">
                                            <Clock size={14} />
                                            {item.semHorario
                                                ? 'Sem horário definido'
                                                : item.duracaoMin ? `${item.duracaoMin} min` : 'Tempo a combinar'}
                                        </span>
                                    </>
                                )}
                            </span>

                            {item.vazio ? (
                                <span className="esqueleto" style={{ width: 80, height: 18 }} />
                            ) : (
                                <strong className="servico-preco">
                                    {modo === 'combinar' || item.aCombinar ? 'A combinar' : formatarMoeda(item.preco)}
                                </strong>
                            )}

                            <span className={`servico-marca ${modo === 'combinar' ? 'quadrada' : ''}`} aria-hidden="true">
                                {ativo && <Check size={14} strokeWidth={3} />}
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

export default ListaServicos;
