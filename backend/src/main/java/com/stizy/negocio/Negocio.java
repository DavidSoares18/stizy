package com.stizy.negocio;

import com.stizy.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.UUID;

/** V5: como o cliente vê o provedor. Um negócio por profissional. */
@Entity
@Table(name = "negocios")
public class Negocio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profissional_id", nullable = false, unique = true)
    private Usuario profissional;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 300)
    private String descricao;

    @Column(nullable = false, length = 40)
    private String categoria;

    @Column(length = 8)
    private String cep;

    @Column(length = 150)
    private String endereco;

    @Column(length = 80)
    private String complemento;

    @Column(length = 80)
    private String bairro;

    @Column(length = 80)
    private String cidade;

    protected Negocio() {
        // Exigido pelo JPA.
    }

    public Negocio(Usuario profissional) {
        this.profissional = profissional;
    }

    public UUID getId() { return id; }
    public Usuario getProfissional() { return profissional; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
    public String getCategoria() { return categoria; }
    public String getCep() { return cep; }
    public String getEndereco() { return endereco; }
    public String getComplemento() { return complemento; }
    public String getBairro() { return bairro; }
    public String getCidade() { return cidade; }

    public void atualizar(String nome, String descricao, String categoria, String cep,
                          String endereco, String complemento, String bairro, String cidade) {
        this.nome = nome;
        this.descricao = descricao;
        this.categoria = categoria;
        this.cep = cep;
        this.endereco = endereco;
        this.complemento = complemento;
        this.bairro = bairro;
        this.cidade = cidade;
    }
}
