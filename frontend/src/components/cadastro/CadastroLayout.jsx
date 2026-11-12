import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import logo from '../../assets/logo-branca.png';
import TopoMobile from '../layout/TopoMobile';
import { ROTAS } from '../../constants/rotas';
import './CadastroLayout.css';

/**
 * Estrutura comum dos cadastros em passos (cliente: 2 passos; provedor: 7 passos).
 *
 * Desktop : barra roxa + coluna lateral com a lista de passos + formulário à direita.
 * Mobile  : topo "Cadastro" com seta voltar, barra de progresso e botões fixos no rodapé.
 *
 * Props:
 *  - selo                 : texto do selo amarelo ("Novo por aqui", "Primeiro acesso")
 *  - tituloLateral/subtituloLateral : cabeçalho da coluna de passos
 *  - passos               : [{ titulo, descricao }]
 *  - passoAtual           : índice do passo ativo (começa em 0)
 *  - tituloPasso/subtituloPasso : cabeçalho do formulário
 *  - rotuloContinuar      : texto do botão principal ("Continuar", "Criar conta"...)
 *  - linkSecundario       : { rotulo, onClick } ou { rotulo, para } (rota)
 *  - onVoltar / onContinuar / enviando
 *  - children             : campos do passo (dentro do card cinza)
 */
function CadastroLayout({
    selo, tituloLateral, subtituloLateral, passos, passoAtual,
    tituloPasso, subtituloPasso, rotuloContinuar = 'Continuar',
    linkSecundario, onVoltar, onContinuar, enviando, children,
}) {
    const total = passos.length;

    return (
        <div className="cadastro">
            {/* Topo desktop */}
            <header className="cadastro-topo">
                <Link to={ROTAS.LOGIN} aria-label="STIZY - voltar ao login"><img src={logo} alt="STIZY" /></Link>
                <span className="selo selo-amarelo">{selo}</span>
            </header>

            {/* Topo mobile */}
            <TopoMobile titulo="Cadastro" voltar={onVoltar || ROTAS.LOGIN}
                acao={<span className="selo selo-amarelo">{selo}</span>} />

            <div className="cadastro-corpo">
                <aside className="cadastro-lateral">
                    <h2>{tituloLateral}</h2>
                    <p>{subtituloLateral}</p>
                    <ol className="cadastro-passos">
                        {passos.map((passo, i) => {
                            const estado = i < passoAtual ? 'feito' : i === passoAtual ? 'atual' : 'futuro';
                            return (
                                <li key={passo.titulo} className={`cadastro-passo ${estado}`} aria-current={estado === 'atual' ? 'step' : undefined}>
                                    <span className="cadastro-passo-bolinha">
                                        {estado === 'feito' ? <Check size={14} strokeWidth={3} /> : i + 1}
                                    </span>
                                    <span>
                                        <strong>{passo.titulo}</strong>
                                        <small>{passo.descricao}</small>
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                </aside>

                <form className="cadastro-conteudo" onSubmit={(e) => { e.preventDefault(); onContinuar(); }} noValidate>
                    <p className="cadastro-contador">Passo {passoAtual + 1} de {total}</p>
                    <div className="cadastro-progresso" aria-hidden="true">
                        {passos.map((p, i) => <span key={p.titulo} className={i <= passoAtual ? 'ativo' : ''} />)}
                    </div>
                    <h1>{tituloPasso}</h1>
                    <p className="cadastro-subtitulo">{subtituloPasso}</p>

                    <div className="cadastro-cartao">{children}</div>

                    <div className="cadastro-rodape">
                        {onVoltar && (
                            <button type="button" className="btn btn-contorno forte cadastro-voltar" onClick={onVoltar}>Voltar</button>
                        )}
                        {linkSecundario && (linkSecundario.para
                            ? <Link to={linkSecundario.para} className="link-roxo cadastro-link">{linkSecundario.rotulo}</Link>
                            : <button type="button" className="link-roxo cadastro-link" onClick={linkSecundario.onClick}>{linkSecundario.rotulo}</button>)}
                        <button type="submit" className="btn btn-primario cadastro-continuar" disabled={enviando}>
                            {enviando ? 'Aguarde...' : rotuloContinuar}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CadastroLayout;
