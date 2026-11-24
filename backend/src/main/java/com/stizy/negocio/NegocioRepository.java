package com.stizy.negocio;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NegocioRepository extends JpaRepository<Negocio, UUID> {

    Optional<Negocio> findByProfissional_Id(UUID profissionalId);

    List<Negocio> findAllByProfissional_IdIn(Collection<UUID> profissionalIds);

    /** Busca por nome/descrição do negócio ou nome de um serviço ativo. termo já vem como "%texto%". */
    @Query("""
            select n from Negocio n
            where lower(n.nome) like :termo
               or lower(coalesce(n.descricao, '')) like :termo
               or exists (select s.id from Servico s
                          where s.profissional = n.profissional and s.ativo = true
                            and lower(s.nome) like :termo)
            order by n.nome
            """)
    List<Negocio> buscar(@Param("termo") String termo);

    @Query("""
            select n from Negocio n
            where n.categoria = :categoria
              and (lower(n.nome) like :termo
                   or lower(coalesce(n.descricao, '')) like :termo
                   or exists (select s.id from Servico s
                              where s.profissional = n.profissional and s.ativo = true
                                and lower(s.nome) like :termo))
            order by n.nome
            """)
    List<Negocio> buscarPorCategoria(@Param("categoria") String categoria, @Param("termo") String termo);
}
