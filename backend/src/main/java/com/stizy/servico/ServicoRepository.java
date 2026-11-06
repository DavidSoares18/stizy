package com.stizy.servico;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServicoRepository extends JpaRepository<Servico, UUID> {

    List<Servico> findAllByProfissional_IdOrderByNomeAsc(UUID profissionalId);

    Optional<Servico> findByIdAndProfissional_Id(UUID id, UUID profissionalId);
}