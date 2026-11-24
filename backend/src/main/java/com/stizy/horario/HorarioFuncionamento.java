package com.stizy.horario;

import com.stizy.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalTime;
import java.util.UUID;

/**
 * V3: uma faixa de atendimento da grade semanal (hora local do negócio).
 * Pausa para almoço = duas faixas no mesmo dia.
 */
@Entity
@Table(name = "horarios_funcionamento")
public class HorarioFuncionamento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profissional_id", nullable = false)
    private Usuario profissional;

    /** 1 = segunda ... 7 = domingo (java.time.DayOfWeek.getValue()). */
    @Column(name = "dia_semana", nullable = false)
    private Integer diaSemana;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fim", nullable = false)
    private LocalTime horaFim;

    protected HorarioFuncionamento() {
        // Exigido pelo JPA.
    }

    public HorarioFuncionamento(Usuario profissional, Integer diaSemana, LocalTime horaInicio, LocalTime horaFim) {
        this.profissional = profissional;
        this.diaSemana = diaSemana;
        this.horaInicio = horaInicio;
        this.horaFim = horaFim;
    }

    public UUID getId() { return id; }
    public Usuario getProfissional() { return profissional; }
    public Integer getDiaSemana() { return diaSemana; }
    public LocalTime getHoraInicio() { return horaInicio; }
    public LocalTime getHoraFim() { return horaFim; }
}
