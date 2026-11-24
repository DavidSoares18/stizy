package com.stizy.bloqueio;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BloqueioRepository extends JpaRepository<Bloqueio, UUID> {

    /** Bloqueios que encostam no intervalo [inicio, fim). */
    @Query("""
            select b from Bloqueio b
            where b.profissional.id = :profissionalId and b.inicio < :fim and b.fim > :inicio
            order by b.inicio
            """)
    List<Bloqueio> noPeriodo(@Param("profissionalId") UUID profissionalId,
                             @Param("inicio") Instant inicio,
                             @Param("fim") Instant fim);

    Optional<Bloqueio> findByIdAndProfissional_Id(UUID id, UUID profissionalId);
}
