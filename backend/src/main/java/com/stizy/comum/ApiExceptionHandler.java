package com.stizy.comum;

import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

/**
 * Formato único de erro da API:
 * { "status": 409, "erro": "Horário indisponível", "campos": { ... }, "instante": "..." }
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    /** 23P01 = violação de EXCLUDE (sobreposição); 40P01 = deadlock entre reservas simultâneas. */
    private static final String SOBREPOSICAO = "23P01";
    private static final String DEADLOCK = "40P01";

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, Object>> status(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        String mensagem = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
        return corpo(status, mensagem, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> validacao(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError erro : ex.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(erro.getField(), erro.getDefaultMessage());
        }
        ex.getBindingResult().getGlobalErrors()
                .forEach(erro -> campos.putIfAbsent(erro.getObjectName(), erro.getDefaultMessage()));
        return corpo(HttpStatus.BAD_REQUEST, "Dados inválidos", campos);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class
    })
    ResponseEntity<Map<String, Object>> requisicaoInvalida(Exception ex) {
        String mensagem = ex instanceof MissingServletRequestParameterException faltando
                ? "Parâmetro obrigatório ausente: " + faltando.getParameterName()
                : "Requisição inválida: verifique o formato dos dados (datas em ISO 8601)";
        return corpo(HttpStatus.BAD_REQUEST, mensagem, null);
    }

    @ExceptionHandler({DataIntegrityViolationException.class, PessimisticLockingFailureException.class})
    ResponseEntity<Map<String, Object>> integridade(DataAccessException ex) {
        String sqlState = ex.getMostSpecificCause() instanceof SQLException sql ? sql.getSQLState() : null;
        if (SOBREPOSICAO.equals(sqlState) || DEADLOCK.equals(sqlState)
                || ex instanceof PessimisticLockingFailureException) {
            return corpo(HttpStatus.CONFLICT, "Horário indisponível: conflita com outro registro", null);
        }
        log.warn("Violação de integridade não tratada (SQLState {})", sqlState, ex);
        return corpo(HttpStatus.CONFLICT, "Operação viola uma regra de integridade dos dados", null);
    }

    private ResponseEntity<Map<String, Object>> corpo(HttpStatus status, String mensagem,
                                                      Map<String, String> campos) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("status", status.value());
        corpo.put("erro", mensagem);
        if (campos != null && !campos.isEmpty()) {
            corpo.put("campos", campos);
        }
        corpo.put("instante", Instant.now().toString());
        return ResponseEntity.status(status).body(corpo);
    }
}
