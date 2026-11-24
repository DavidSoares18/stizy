package com.stizy.horario;

import com.stizy.usuario.Usuario;
import com.stizy.usuario.UsuarioService;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** STZ-14: consulta e atualização da grade semanal de atendimento. */
@Service
public class HorarioFuncionamentoService {

    private final HorarioFuncionamentoRepository repository;
    private final UsuarioService usuarioService;

    public HorarioFuncionamentoService(HorarioFuncionamentoRepository repository, UsuarioService usuarioService) {
        this.repository = repository;
        this.usuarioService = usuarioService;
    }

    @Transactional(readOnly = true)
    public List<FaixaHorarioResponse> listarDoProfissional(UUID usuarioId) {
        usuarioService.obterProfissional(usuarioId);
        return listar(usuarioId);
    }

    /** Também usado na página pública do negócio. */
    @Transactional(readOnly = true)
    public List<FaixaHorarioResponse> listar(UUID profissionalId) {
        return repository.findAllByProfissional_IdOrderByDiaSemanaAscHoraInicioAsc(profissionalId)
                .stream()
                .map(FaixaHorarioResponse::de)
                .toList();
    }

    @Transactional
    public List<FaixaHorarioResponse> substituirGrade(UUID usuarioId, GradeHorarioRequest request) {
        Usuario profissional = usuarioService.obterProfissional(usuarioId);
        validarSemSobreposicao(request.faixas());

        repository.apagarGrade(usuarioId);
        List<HorarioFuncionamento> novas = request.faixas().stream()
                .map(f -> new HorarioFuncionamento(profissional, f.diaSemana(), f.horaInicio(), f.horaFim()))
                .toList();
        repository.saveAllAndFlush(novas);
        return listar(usuarioId);
    }

    /** A V3 também recusa sobreposição; aqui a mensagem sai clara (400) antes de chegar no banco. */
    static void validarSemSobreposicao(List<FaixaHorarioRequest> faixas) {
        List<FaixaHorarioRequest> ordenadas = faixas.stream()
                .sorted(Comparator.comparing(FaixaHorarioRequest::diaSemana)
                        .thenComparing(FaixaHorarioRequest::horaInicio))
                .toList();
        for (int i = 1; i < ordenadas.size(); i++) {
            FaixaHorarioRequest anterior = ordenadas.get(i - 1);
            FaixaHorarioRequest atual = ordenadas.get(i);
            if (anterior.diaSemana().equals(atual.diaSemana())
                    && atual.horaInicio().isBefore(anterior.horaFim())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.format(
                        "Faixas sobrepostas no dia %d: %s-%s e %s-%s", atual.diaSemana(),
                        anterior.horaInicio(), anterior.horaFim(), atual.horaInicio(), atual.horaFim()));
            }
        }
    }
}
