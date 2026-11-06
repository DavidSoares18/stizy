package com.stizy.servico;

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
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "servicos")
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(name = "duracao_minutos", nullable = false)
    private Integer duracaoMinutos;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal preco;

    @Column(nullable = false)
    private boolean ativo = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profissional_id", nullable = false)
    private Usuario profissional;

    protected Servico() {
        // Exigido pelo JPA.
    }

    public Servico(String nome, Integer duracaoMinutos, BigDecimal preco, Usuario profissional) {
        this.nome = nome;
        this.duracaoMinutos = duracaoMinutos;
        this.preco = preco;
        this.profissional = profissional;
        this.ativo = true;
    }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public Integer getDuracaoMinutos() { return duracaoMinutos; }
    public BigDecimal getPreco() { return preco; }
    public boolean isAtivo() { return ativo; }
    public Usuario getProfissional() { return profissional; }

    public void setNome(String nome) { this.nome = nome; }
    public void setDuracaoMinutos(Integer duracaoMinutos) { this.duracaoMinutos = duracaoMinutos; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}