package com.stizy.servico;

import com.stizy.usuario.Usuario;
import com.stizy.usuario.UsuarioService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * STZ-13: CRUD de serviços do profissional logado.
 * - Só PROFISSIONAL gerencia serviços; cada um só enxerga os próprios (outro profissional recebe 404).
 * - O profissional vem sempre do JWT, nunca do corpo da requisição.
 * - DELETE só desativa (ativo = false): agendamentos antigos continuam apontando para o serviço.
 */
@Service
public class ServicoService {

    private final ServicoRepository servicoRepository;
    private final UsuarioService usuarioService;

    public ServicoService(ServicoRepository servicoRepository, UsuarioService usuarioService) {
        this.servicoRepository = servicoRepository;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public ServicoResponse criar(UUID usuarioId, ServicoRequest request) {
        Usuario profissional = usuarioService.obterProfissional(usuarioId);
        Servico servico = new Servico(
                request.nome().trim(), request.duracaoMinutos(), request.preco(), profissional);
        return ServicoResponse.from(servicoRepository.save(servico));
    }

    @Transactional(readOnly = true)
    public List<ServicoResponse> listar(UUID usuarioId) {
        usuarioService.obterProfissional(usuarioId);
        return servicoRepository.findAllByProfissional_IdOrderByNomeAsc(usuarioId)
                .stream()
                .map(ServicoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServicoResponse buscar(UUID usuarioId, UUID servicoId) {
        usuarioService.obterProfissional(usuarioId);
        return ServicoResponse.from(obterServicoDoProfissional(servicoId, usuarioId));
    }

    @Transactional
    public ServicoResponse atualizar(UUID usuarioId, UUID servicoId, ServicoRequest request) {
        usuarioService.obterProfissional(usuarioId);
        Servico servico = obterServicoDoProfissional(servicoId, usuarioId);
        // Agendamentos já feitos guardam o próprio preço e fim; mudar o serviço não os altera.
        servico.setNome(request.nome().trim());
        servico.setDuracaoMinutos(request.duracaoMinutos());
        servico.setPreco(request.preco());
        return ServicoResponse.from(servico);
    }

    @Transactional
    public void desativar(UUID usuarioId, UUID servicoId) {
        usuarioService.obterProfissional(usuarioId);
        obterServicoDoProfissional(servicoId, usuarioId).setAtivo(false);
    }

    @Transactional
    public ServicoResponse reativar(UUID usuarioId, UUID servicoId) {
        usuarioService.obterProfissional(usuarioId);
        Servico servico = obterServicoDoProfissional(servicoId, usuarioId);
        servico.setAtivo(true);
        return ServicoResponse.from(servico);
    }

    private Servico obterServicoDoProfissional(UUID servicoId, UUID usuarioId) {
        return servicoRepository.findByIdAndProfissional_Id(servicoId, usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Serviço não encontrado"));
    }
}
