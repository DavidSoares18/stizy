package com.stizy.agendamento;

import com.stizy.servico.Servico;
import com.stizy.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * V4: reserva de um cliente com um profissional para um serviço.
 * fim = inicio + duração do serviço; preco é copiado do serviço na hora da reserva.
 * O banco recusa sobreposição para o mesmo profissional (EXCLUDE, erro 23P01 -> 409).
 */
@Entity
@Table(name = "agendamentos")
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profissional_id", nullable = false)
    private Usuario profissional;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @Column(nullable = false)
    private Instant inicio;

    @Column(nullable = false)
    private Instant fim;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal preco;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAgendamento status = StatusAgendamento.CONFIRMADO;

    @Column(name = "cancelado_em")
    private Instant canceladoEm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelado_por_id")
    private Usuario canceladoPor;

    /** V6 (EXTRA-04): quando o lembrete por e-mail foi enviado. */
    @Column(name = "lembrete_enviado_em")
    private Instant lembreteEnviadoEm;

    protected Agendamento() {
        // Exigido pelo JPA.
    }

    public Agendamento(Usuario cliente, Usuario profissional, Servico servico, Instant inicio) {
        this.cliente = cliente;
        this.profissional = profissional;
        this.servico = servico;
        this.inicio = inicio;
        this.fim = inicio.plusSeconds(servico.getDuracaoMinutos() * 60L);
        this.preco = servico.getPreco();
        this.status = StatusAgendamento.CONFIRMADO;
    }

    public void cancelar(Usuario quem, Instant quando) {
        this.status = StatusAgendamento.CANCELADO;
        this.canceladoEm = quando;
        this.canceladoPor = quem;
    }

    /** Mantém a duração original da reserva e o preço combinado. */
    public void remarcar(Instant novoInicio) {
        long duracao = fim.getEpochSecond() - inicio.getEpochSecond();
        this.inicio = novoInicio;
        this.fim = novoInicio.plusSeconds(duracao);
        this.lembreteEnviadoEm = null;
    }

    public void finalizar(StatusAgendamento novoStatus) {
        this.status = novoStatus;
    }

    public void marcarLembreteEnviado(Instant quando) {
        this.lembreteEnviadoEm = quando;
    }

    public boolean isAtivo() {
        return status != StatusAgendamento.CANCELADO;
    }

    public UUID getId() { return id; }
    public Usuario getCliente() { return cliente; }
    public Usuario getProfissional() { return profissional; }
    public Servico getServico() { return servico; }
    public Instant getInicio() { return inicio; }
    public Instant getFim() { return fim; }
    public BigDecimal getPreco() { return preco; }
    public StatusAgendamento getStatus() { return status; }
    public Instant getCanceladoEm() { return canceladoEm; }
    public Usuario getCanceladoPor() { return canceladoPor; }
    public Instant getLembreteEnviadoEm() { return lembreteEnviadoEm; }
}
