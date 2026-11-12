import { MapPin, Star } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { iniciais } from '../../utils/formatters';

/**
 * Cabeçalho da página do estabelecimento (avatar, nome, nota e selos).
 *
 * BACKEND: "negocio" vem de negociosService.obterNegocio(id):
 *   { nome, nota, totalAvaliacoes, aberto, horarioFechamento, endereco, distanciaKm,
 *     aceitaPagamentoStizy, tempoEntregaMin, retiradaNaLoja, atendeHoje, pagamentoDireto }
 * Sem "negocio" os campos aparecem vazios (barras cinzas).
 */
function CabecalhoNegocio({ negocio, tipo }) {
    const vazio = !negocio;
    const nota = negocio ? Number(negocio.nota).toFixed(1).replace('.', ',') : '';
    const distancia = negocio?.distanciaKm != null ? String(negocio.distanciaKm).replace('.', ',') : '';

    const selo = (texto, chave) => <span key={chave} className="selo">{texto}</span>;

    // Selos da segunda linha dependem do modelo de negócio
    const selosExtras = [];
    if (negocio) {
        if (tipo === 'produtos') {
            if (negocio.tempoEntregaMin) selosExtras.push(selo(`Entrega em ${negocio.tempoEntregaMin} min`, 'entrega'));
        }
        if (negocio.pagamentoDireto) selosExtras.push(selo('Pagamento direto, fora do STIZY', 'direto'));
        else if (negocio.aceitaPagamentoStizy === false) selosExtras.push(selo('Não aceita pagamentos pelo STIZY', 'nao-stizy'));
        else if (negocio.aceitaPagamentoStizy) selosExtras.push(selo('Aceita pagamento pelo STIZY', 'stizy'));
        if (tipo === 'produtos' && negocio.retiradaNaLoja) selosExtras.push(selo(`Retire na loja · ${negocio.retiradaNaLoja}`, 'retirada'));
    }

    return (
        <header className="negocio-cabecalho">
            <Avatar iniciais={negocio ? iniciais(negocio.nome) : ''} tamanho={80} />
            <div className="negocio-info">
                {vazio ? <span className="esqueleto negocio-nome-vazio" /> : <h1 className="negocio-nome">{negocio.nome}</h1>}

                <div className="negocio-linha">
                    {vazio ? (
                        <span className="esqueleto linha-vazia" />
                    ) : (
                        <>
                            <span className="selo selo-nota"><Star size={11} /> {nota}</span>
                            <span className="negocio-avaliacoes">{negocio.totalAvaliacoes} avaliações</span>
                            {negocio.aberto && negocio.horarioFechamento && selo(`Aberto até ${negocio.horarioFechamento}`, 'aberto')}
                            {negocio.atendeHoje && selo('Atende hoje', 'hoje')}
                            {tipo === 'produtos' && selosExtras.slice(0, 2)}
                        </>
                    )}
                </div>

                <div className="negocio-linha">
                    {vazio ? (
                        <span className="esqueleto linha-vazia curta" />
                    ) : (
                        <>
                            {tipo !== 'produtos' && negocio.endereco && (
                                <span className="negocio-endereco">
                                    <MapPin size={16} /> {negocio.endereco}{distancia && ` · ${distancia} km`}
                                </span>
                            )}
                            {tipo === 'produtos' ? selosExtras.slice(2) : selosExtras}
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default CabecalhoNegocio;
