import { Link } from 'react-router-dom';
import { ROTAS } from '../../constants/rotas';
import './Telas.css';

/**
 * ÍNDICE DE TELAS DO PROTÓTIPO (apoio ao desenvolvimento - rota /telas).
 * Lista todas as telas para navegar direto, sem depender dos dados do backend.
 * Pode ser apagado (junto com a rota em App.jsx) antes de publicar.
 */
const GRUPOS = [
    {
        titulo: 'Acesso',
        itens: [
            ['Login', ROTAS.LOGIN],
            ['Cadastro de cliente (2 passos)', ROTAS.CADASTRO_CLIENTE],
            ['Cadastro de provedor (7 passos)', ROTAS.CADASTRO_PROVEDOR],
        ],
    },
    {
        titulo: 'Cliente (e provedor no modo "Comprar")',
        itens: [
            ['Início', ROTAS.INICIO],
            ['Resultados (Ver todos)', ROTAS.RESULTADOS('perto-de-voce')],
            ['Busca', `${ROTAS.BUSCA}?q=Barbearia`],
            ['Negócio: serviço com horário (Barbearia)', ROTAS.ESTABELECIMENTO('exemplo', 'horario')],
            ['Negócio: serviço a combinar (Salão)', ROTAS.ESTABELECIMENTO('exemplo', 'combinar')],
            ['Negócio: loja de produtos (Gás, Mercado, Padaria)', ROTAS.ESTABELECIMENTO('exemplo', 'produtos')],
            ['Agendar: dia e horário', ROTAS.AGENDAR('exemplo')],
            ['Pagamento', ROTAS.PAGAMENTO],
            ['Pagamento pelo STIZY (QR Code)', ROTAS.PAGAMENTO_QR],
            ['Confirmado', ROTAS.CONFIRMADO],
            ['Agenda (agendamentos)', ROTAS.AGENDA],
            ['Conversas', ROTAS.CONVERSAS],
            ['Perfil', ROTAS.PERFIL],
        ],
    },
    {
        titulo: 'Provedor (exige entrar com a conta de provedor)',
        itens: [
            ['Agenda do dia', ROTAS.PROVEDOR_AGENDA],
            ['Produtos e estoque', ROTAS.PROVEDOR_PRODUTOS],
            ['Folha de pagamento', ROTAS.PROVEDOR_FOLHA],
            ['Perfil do provedor', ROTAS.PROVEDOR_PERFIL],
        ],
    },
];

function Telas() {
    return (
        <div className="pagina coluna-unica">
            <div className="pagina-principal">
                <h1 className="pagina-titulo">Telas do protótipo</h1>
                <p className="telas-ajuda">
                    Atalho para navegar por todas as telas. Os modais (notificações, editar perfil, produto esgotado,
                    pagar taxa etc.) abrem a partir de cada tela.
                </p>
                {GRUPOS.map((grupo) => (
                    <section key={grupo.titulo}>
                        <h2 className="telas-grupo">{grupo.titulo}</h2>
                        <ul className="telas-lista">
                            {grupo.itens.map(([rotulo, caminho]) => (
                                <li key={caminho + rotulo}><Link to={caminho} className="btn btn-contorno forte btn-pequeno">{rotulo}</Link></li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}

export default Telas;
