package com.stizy.usuario;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Trava a linha do profissional até o fim da transação (SELECT ... FOR UPDATE).
     * Usada ao reservar/remarcar: reservas simultâneas do mesmo profissional entram em fila,
     * e a recusa vem sempre como conflito (23P01), não como deadlock (ver docs/BANCO_DE_DADOS.md).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where u.id = :id")
    Optional<Usuario> buscarParaReserva(@Param("id") UUID id);
}
