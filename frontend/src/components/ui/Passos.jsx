import { Check } from 'lucide-react';
import './Passos.css';

/**
 * Indicador do fluxo de agendamento: Serviço > Horário > Pagamento.
 * O Figma pede no máximo 3 passos (RNF01 pede no máximo 4).
 * "atual" é o número do passo ativo (1, 2 ou 3).
 */
function Passos({ atual, rotulos = ['Serviço', 'Horário', 'Pagamento'] }) {
    return (
        <ol className="passos" aria-label="Etapas do agendamento">
            {rotulos.map((rotulo, i) => {
                const numero = i + 1;
                const estado = numero < atual ? 'feito' : numero === atual ? 'atual' : 'futuro';
                return (
                    <li key={rotulo} className={`passo ${estado}`} aria-current={estado === 'atual' ? 'step' : undefined}>
                        <span className="passo-bolinha">
                            {estado === 'feito' ? <Check size={14} strokeWidth={3} /> : numero}
                        </span>
                        <span className="passo-rotulo">{rotulo}</span>
                        {numero < rotulos.length && <span className="passo-linha" />}
                    </li>
                );
            })}
        </ol>
    );
}

export default Passos;
