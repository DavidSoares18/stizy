package com.stizy.agendamento;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface AgendamentoRepository extends JpaRepository<Agendamento, UUID> {

    /** Agendamentos que ainda ocupam horário (não cancelados) e cruzam [inicio, fim). */
    @Query("""
            select a from Agendamento a
            join fetch a.cliente join fetch a.servico
            where a.profissional.id = :profissionalId
              and a.status <> com.stizy.agendamento.StatusAgendamento.CANCELADO
              and a.inicio < :fim and a.fim > :inicio
            order by a.inicio
            """)
    List<Agendamento> ativosNoPeriodo(@Param("profissionalId") UUID profissionalId,
                                      @Param("inicio") Instant inicio,
                                      @Param("fim") Instant fim);

    @Query("""
            select count(a) from Agendamento a
            where a.profissional.id = :profissionalId
              and a.status <> com.stizy.agendamento.StatusAgendamento.CANCELADO
              and a.inicio < :fim and a.fim > :inicio
            """)
    long contarAtivosNoPeriodo(@Param("profissionalId") UUID profissionalId,
                               @Param("inicio") Instant inicio,
                               @Param("fim") Instant fim);

    /** Conflito ignorando o próprio agendamento (usado ao remarcar). */
    @Query("""
            select count(a) > 0 from Agendamento a
            where a.profissional.id = :profissionalId
              and a.id <> :ignorarId
              and a.status <> com.stizy.agendamento.StatusAgendamento.CANCELADO
              and a.inicio < :fim and a.fim > :inicio
            """)
    boolean existeConflito(@Param("profissionalId") UUID profissionalId,
                           @Param("inicio") Instant inicio,
                           @Param("fim") Instant fim,
                           @Param("ignorarId") UUID ignorarId);

    /** Todos os agendamentos do profissional no período, inclusive cancelados (agenda e relatórios). */
    @Query("""
            select a from Agendamento a
            join fetch a.cliente join fetch a.servico
            where a.profissional.id = :profissionalId
              and a.inicio >= :inicio and a.inicio < :fim
            order by a.inicio
            """)
    List<Agendamento> doProfissionalNoPeriodo(@Param("profissionalId") UUID profissionalId,
                                              @Param("inicio") Instant inicio,
                                              @Param("fim") Instant fim);

    @Query("""
            select a from Agendamento a
            join fetch a.profissional join fetch a.servico
            where a.cliente.id = :clienteId
            order by a.inicio desc
            """)
    List<Agendamento> doCliente(@Param("clienteId") UUID clienteId);

    /** EXTRA-03: todos os agendamentos de um profissional (com os clientes) para o histórico. */
    @Query("""
            select a from Agendamento a
            join fetch a.cliente join fetch a.servico
            where a.profissional.id = :profissionalId
            order by a.inicio desc
            """)
    List<Agendamento> todosDoProfissional(@Param("profissionalId") UUID profissionalId);

    @Query("""
            select a from Agendamento a
            join fetch a.cliente join fetch a.servico
            where a.profissional.id = :profissionalId and a.cliente.id = :clienteId
            order by a.inicio desc
            """)
    List<Agendamento> doClienteComProfissional(@Param("profissionalId") UUID profissionalId,
                                               @Param("clienteId") UUID clienteId);

    @Query("""
            select a from Agendamento a
            join fetch a.cliente join fetch a.profissional join fetch a.servico
            where a.id = :id
            """)
    Optional<Agendamento> buscarCompleto(@Param("id") UUID id);

    /** EXTRA-04: confirmados que começam na janela e ainda não receberam lembrete. */
    @Query("""
            select a from Agendamento a
            join fetch a.cliente join fetch a.profissional join fetch a.servico
            where a.status = com.stizy.agendamento.StatusAgendamento.CONFIRMADO
              and a.lembreteEnviadoEm is null
              and a.inicio > :agora and a.inicio <= :limite
            order by a.inicio
            """)
    List<Agendamento> pendentesDeLembrete(@Param("agora") Instant agora, @Param("limite") Instant limite);

    @Transactional
    @Modifying
    @Query("update Agendamento a set a.lembreteEnviadoEm = :quando where a.id = :id")
    void marcarLembreteEnviado(@Param("id") UUID id, @Param("quando") Instant quando);
}
