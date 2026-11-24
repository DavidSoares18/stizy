package com.stizy.bloqueio;

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
import java.time.Instant;
import java.util.UUID;

/** V3: período em que o profissional não atende (folga, férias, horário bloqueado). O fim não conta. */
@Entity
@Table(name = "bloqueios")
public class Bloqueio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profissional_id", nullable = false)
    private Usuario profissional;

    @Column(nullable = false)
    private Instant inicio;

    @Column(nullable = false)
    private Instant fim;

    @Column(length = 255)
    private String motivo;

    protected Bloqueio() {
        // Exigido pelo JPA.
    }

    public Bloqueio(Usuario profissional, Instant inicio, Instant fim, String motivo) {
        this.profissional = profissional;
        this.inicio = inicio;
        this.fim = fim;
        this.motivo = motivo;
    }

    public UUID getId() { return id; }
    public Usuario getProfissional() { return profissional; }
    public Instant getInicio() { return inicio; }
    public Instant getFim() { return fim; }
    public String getMotivo() { return motivo; }
}
