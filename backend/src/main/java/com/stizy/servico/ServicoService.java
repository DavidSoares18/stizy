package com.stizy.servico;

import com.stizy.usuario.Papel;
import com.stizy.usuario.Usuario;
import com.stizy.usuario.UsuarioRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ServicoService {

    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;

    public ServicoService(ServicoRepository servicoRepository,
                         UsuarioRepository usuarioRepository) {
        this.servicoRepository = servicoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public ServicoResponse criar(UUID usuarioId, ServicoRequest request) {
        Usuario profissional = obterProfissional(usuarioId);
        Servico servico = new Servico(
                request.nome().trim(), request.duracaoMinutos(), request.preco(), profissional
        );
        return ServicoResponse.from(servicoRepository.save(servico));
    }

    @Transactional(readOnly = true)
    public List<ServicoResponse> listar(UUID usuarioId) {
        obterProfissional(usuarioId);
        return servicoRepository.findAllByProfissional_IdOrderByNomeAsc(usuarioId)
                .stream()
                .map(ServicoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServicoResponse buscar(UUID usuarioId, UUID servicoId) {
        obterProfissional(usuarioId);
        return ServicoResponse.from(obterServicoDoProfissional(servicoId, usuarioId));
    }

    @Transactional
    public ServicoResponse atualizar(UUID usuarioId, UUID servicoId, ServicoRequest request) {
        obterProfissional(usuarioId);
        Servico servico = obterServicoDoProfissional(servicoId, usuarioId);
        servico.setNome(request.nome().trim());
        servico.setDuracaoMinutos(request.duracaoMinutos());
        servico.setPreco(request.preco());
        return ServicoResponse.from(servico);
        // Dirty checking do JPA persiste as alterações na transação.
    }

    @Transactional
    public void desativar(UUID usuarioId, UUID servicoId) {
        obterProfissional(usuarioId);
        Servico servico = obterServicoDoProfissional(servicoId, usuarioId);
        servico.setAtivo(false);
    }

    @Transactional
    public ServicoResponse reativar(UUID usuarioId, UUID servicoId) {
        obterProfissional(usuarioId);
        Servico servico = obterServicoDoProfissional(servicoId, usuarioId);
        servico.setAtivo(true);
        return ServicoResponse.from(servico);
    }

    private Usuario obterProfissional(UUID usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Usuário autenticado não encontrado"));
        if (usuario.getPapel() != Papel.PROFISSIONAL) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Somente profissionais podem gerenciar serviços");
        }
        return usuario;
    }

    private Servico obterServicoDoProfissional(UUID servicoId, UUID usuarioId) {
        return servicoRepository.findByIdAndProfissional_Id(servicoId, usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Serviço não encontrado"));
    }
}