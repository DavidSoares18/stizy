import { useState } from 'react';
import { Mail, User } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { atualizarPerfil } from '../../services/authService';

/**
 * Modal "Editar perfil" (cliente) / "Editar dados" (provedor).
 * BACKEND: authService.atualizarPerfil -> PUT /usuarios/me
 */
function ModalEditarPerfil({ aberto, onFechar, titulo = 'Editar perfil' }) {
    const { usuario, atualizarUsuario } = useAuth();
    const [nome, setNome] = useState(usuario?.nome || '');
    const [email, setEmail] = useState(usuario?.email || '');
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);

    const salvar = async (e) => {
        e.preventDefault();
        if (!nome.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            setErro('Informe um nome e um e-mail válidos.');
            return;
        }
        setSalvando(true);
        try {
            await atualizarPerfil({ nome: nome.trim(), email: email.trim() });
            atualizarUsuario({ nome: nome.trim(), email: email.trim() });
            setErro('');
            onFechar();
        } catch {
            setErro('Não foi possível salvar agora. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    // Dica: renderize este modal só quando estiver aberto ({aberto && <ModalEditarPerfil ... />})
    // para o formulário sempre reabrir com os dados atuais do usuário.
    return (
        <Modal aberto={aberto} onFechar={onFechar} titulo={titulo}>
            <form className="modal-form" onSubmit={salvar} noValidate>
                <div className="campo">
                    <label htmlFor="perfil-nome">Nome</label>
                    <div className="campo-entrada">
                        <User />
                        <input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
                    </div>
                </div>
                <div className="campo">
                    <label htmlFor="perfil-email">E-mail</label>
                    <div className="campo-entrada">
                        <Mail />
                        <input id="perfil-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                    </div>
                </div>
                {erro && <p className="campo-erro" role="alert">{erro}</p>}
                <div className="modal-acoes coluna">
                    <button type="submit" className="btn btn-primario" disabled={salvando}>
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button type="button" className="btn btn-contorno" onClick={onFechar}>Cancelar</button>
                </div>
            </form>
        </Modal>
    );
}

export default ModalEditarPerfil;
