package com.stizy.agendamento;

import com.stizy.negocio.Negocio;
import com.stizy.negocio.NegocioRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** Monta as respostas buscando os negócios de uma vez (evita uma consulta por agendamento). */
@Component
public class AgendamentoMapper {

    private final NegocioRepository negocioRepository;

    public AgendamentoMapper(NegocioRepository negocioRepository) {
        this.negocioRepository = negocioRepository;
    }

    public AgendamentoResponse resposta(Agendamento agendamento) {
        return respostas(List.of(agendamento)).getFirst();
    }

    public List<AgendamentoResponse> respostas(List<Agendamento> agendamentos) {
        if (agendamentos.isEmpty()) {
            return List.of();
        }
        List<UUID> profissionais = agendamentos.stream().map(a -> a.getProfissional().getId()).distinct().toList();
        Map<UUID, Negocio> negocios = negocioRepository.findAllByProfissional_IdIn(profissionais).stream()
                .collect(Collectors.toMap(n -> n.getProfissional().getId(), Function.identity()));
        return agendamentos.stream()
                .map(a -> AgendamentoResponse.de(a, negocios.get(a.getProfissional().getId())))
                .toList();
    }
}
