import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import CardNegocio from '../../components/ui/CardNegocio';
import useDados from '../../hooks/useDados';
import { listarNegocios } from '../../services/negociosService';
import { tipoDaSecao, tituloDaSecao } from '../../constants/categorias';
import './Resultados.css';

/**
 * "Ver todos" de uma seção do início, ou uma categoria escolhida.
 * Grade de negócios (3 colunas no desktop, 1 no mobile). Rota: /resultados/:secao
 * BACKEND: negociosService.listarNegocios(slug) devolve a lista completa.
 */
function Resultados() {
    const { secao } = useParams();
    const navigate = useNavigate();
    const titulo = tituloDaSecao(secao);

    const { dados, carregando, erro, recarregar } = useDados(() => listarNegocios(secao), [secao], []);
    const lista = dados || [];

    // Sem dados: 12 cards vazios para mostrar a grade
    const cards = lista.length > 0 ? lista : Array.from({ length: 12 }, () => null);

    return (
        <>
            <TopoMobile titulo={titulo} voltar />

            <div className="pagina coluna-unica">
                <div className="pagina-principal">
                    <header className="resultados-topo">
                        <button type="button" className="resultados-voltar" onClick={() => navigate(-1)}>
                            <ChevronLeft size={20} /> Voltar
                        </button>
                        <div>
                            <h1 className="pagina-titulo">{titulo}</h1>
                            <p className="resultados-total">
                                {lista.length > 0 ? `${lista.length} negócios` : 'Nenhum negócio carregado ainda'}
                            </p>
                        </div>
                    </header>

                    {erro && (
                        <div className="aviso-erro" role="alert">
                            Não foi possível carregar os negócios.{' '}
                            <button type="button" className="link-roxo" onClick={recarregar}>Tentar novamente</button>
                        </div>
                    )}

                    <div className={`resultados-grade ${carregando ? 'carregando' : ''}`}>
                        {cards.map((negocio, i) => (
                            <CardNegocio
                                key={negocio?.id ?? `vazio-${i}`}
                                negocio={negocio}
                                variante="lista"
                                tipoPadrao={tipoDaSecao(secao)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Resultados;
