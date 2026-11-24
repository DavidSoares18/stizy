package com.stizy.negocio;

import com.stizy.disponibilidade.DisponibilidadeService;
import com.stizy.disponibilidade.HorarioDisponivelResponse;
import com.stizy.horario.FaixaHorarioResponse;
import com.stizy.horario.HorarioFuncionamentoService;
import com.stizy.servico.ServicoResponse;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Catálogo visto pelo cliente. Público (sem login) para o link de agendamento funcionar (EXTRA-02);
 * a reserva em si (POST /api/agendamentos) exige login.
 */
@RestController
@RequestMapping("/api/negocios")
public class NegocioPublicoController {

    private final NegocioService negocioService;
    private final HorarioFuncionamentoService horarioService;
    private final DisponibilidadeService disponibilidadeService;

    public NegocioPublicoController(NegocioService negocioService,
                                    HorarioFuncionamentoService horarioService,
                                    DisponibilidadeService disponibilidadeService) {
        this.negocioService = negocioService;
        this.horarioService = horarioService;
        this.disponibilidadeService = disponibilidadeService;
    }

    /** GET /api/negocios?categoria=barbearia&q=corte */
    @GetMapping
    public List<NegocioResponse> listar(@RequestParam(required = false) String categoria,
                                        @RequestParam(required = false) String q) {
        return negocioService.listar(categoria, q);
    }

    /** GET /api/negocios/busca?q=corte (nome do negócio, descrição ou serviço) */
    @GetMapping("/busca")
    public List<NegocioResponse> buscar(@RequestParam(defaultValue = "") String q) {
        return negocioService.listar(null, q);
    }

    @GetMapping("/{id}")
    public NegocioResponse detalhe(@PathVariable UUID id) {
        return negocioService.detalhe(id);
    }

    /** Só serviços ativos. */
    @GetMapping("/{id}/servicos")
    public List<ServicoResponse> servicos(@PathVariable UUID id) {
        return negocioService.servicosAtivos(id);
    }

    /** Grade semanal do negócio (para mostrar "aberto de seg a sex, 08:00-18:00"). */
    @GetMapping("/{id}/funcionamento")
    public List<FaixaHorarioResponse> funcionamento(@PathVariable UUID id) {
        return horarioService.listar(negocioService.obter(id).getProfissional().getId());
    }

    /** STZ-19: GET /api/negocios/{id}/horarios?data=2026-12-01&servicoId=... */
    @GetMapping("/{id}/horarios")
    public List<HorarioDisponivelResponse> horarios(@PathVariable UUID id,
                                                    @RequestParam LocalDate data,
                                                    @RequestParam UUID servicoId) {
        return disponibilidadeService.horarios(id, data, servicoId);
    }
}
