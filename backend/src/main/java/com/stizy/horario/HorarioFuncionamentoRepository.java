package com.stizy.horario;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HorarioFuncionamentoRepository extends JpaRepository<HorarioFuncionamento, UUID> {

    List<HorarioFuncionamento> findAllByProfissional_IdOrderByDiaSemanaAscHoraInicioAsc(UUID profissionalId);

    List<HorarioFuncionamento> findAllByProfissional_IdAndDiaSemanaOrderByHoraInicioAsc(UUID profissionalId,
                                                                                         Integer diaSemana);

    /**
     * DELETE executado na hora. Com o delete derivado do Spring Data, o Hibernate faria os INSERTs
     * da grade nova antes dos DELETEs e a restrição de sobreposição da V3 recusaria a troca.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from HorarioFuncionamento h where h.profissional.id = :profissionalId")
    void apagarGrade(@Param("profissionalId") UUID profissionalId);
}
