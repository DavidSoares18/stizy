package com.stizy.negocio;

import com.stizy.servico.ServicoRepository;
import com.stizy.servico.ServicoResponse;
import com.stizy.usuario.Usuario;
import com.stizy.usuario.UsuarioService;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NegocioService {

    private final NegocioRepository negocioRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioService usuarioService;
    private final String urlFront;

    public NegocioService(NegocioRepository negocioRepository,
                          ServicoRepository servicoRepository,
                          UsuarioService usuarioService,
                          @Value("${stizy.front-url:http://localhost:5173}") String urlFront) {
        this.negocioRepository = negocioRepository;
        this.servicoRepository = servicoRepository;
        this.usuarioService = usuarioService;
        this.urlFront = urlFront.endsWith("/") ? urlFront.substring(0, urlFront.length() - 1) : urlFront;
    }

    // ---------- Área do profissional ----------

    @Transactional(readOnly = true)
    public NegocioResponse doProfissional(UUID usuarioId) {
        usuarioService.obterProfissional(usuarioId);
        return negocioRepository.findByProfissional_Id(usuarioId)
                .map(this::resposta)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Negócio ainda não cadastrado"));
    }

    /** Cria o negócio na primeira chamada e atualiza nas seguintes (um por profissional). */
    @Transactional
    public NegocioResponse salvar(UUID usuarioId, NegocioRequest request) {
        Usuario profissional = usuarioService.obterProfissional(usuarioId);
        Negocio negocio = negocioRepository.findByProfissional_Id(usuarioId)
                .orElseGet(() -> new Negocio(profissional));
        negocio.atualizar(
                request.nome().trim(),
                vazioParaNulo(request.descricao()),
                request.categoria(),
                request.cep() == null || request.cep().isBlank() ? null : request.cep().replaceAll("\\D", ""),
                vazioParaNulo(request.endereco()),
                vazioParaNulo(request.complemento()),
                vazioParaNulo(request.bairro()),
                vazioParaNulo(request.cidade()));
        return resposta(negocioRepository.saveAndFlush(negocio));
    }

    // ---------- Público (EXTRA-02: link público, sem login) ----------

    @Transactional(readOnly = true)
    public List<NegocioResponse> listar(String categoria, String busca) {
        String termo = "%" + (busca == null ? "" : busca.trim().toLowerCase(Locale.ROOT)) + "%";
        List<Negocio> negocios = categoria == null || categoria.isBlank()
                ? negocioRepository.buscar(termo)
                : negocioRepository.buscarPorCategoria(categoria.trim(), termo);
        return negocios.stream().map(this::resposta).toList();
    }

    @Transactional(readOnly = true)
    public NegocioResponse detalhe(UUID negocioId) {
        return resposta(obter(negocioId));
    }

    @Transactional(readOnly = true)
    public List<ServicoResponse> servicosAtivos(UUID negocioId) {
        Negocio negocio = obter(negocioId);
        return servicoRepository
                .findAllByProfissional_IdAndAtivoTrueOrderByNomeAsc(negocio.getProfissional().getId())
                .stream()
                .map(ServicoResponse::from)
                .toList();
    }

    /** O front manda negocioId; as outras tabelas usam profissional_id. */
    @Transactional(readOnly = true)
    public Negocio obter(UUID negocioId) {
        return negocioRepository.findById(negocioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negócio não encontrado"));
    }

    private NegocioResponse resposta(Negocio negocio) {
        return NegocioResponse.de(negocio, urlFront);
    }

    private static String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
