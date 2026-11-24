package com.stizy.horario;

import com.stizy.comum.UsuarioAutenticado;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** STZ-14: grade semanal do profissional logado. */
@RestController
@RequestMapping("/api/provedor/horarios")
public class HorarioFuncionamentoController {

    private final HorarioFuncionamentoService service;

    public HorarioFuncionamentoController(HorarioFuncionamentoService service) {
        this.service = service;
    }

    @GetMapping
    public List<FaixaHorarioResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        return service.listarDoProfissional(UsuarioAutenticado.id(jwt));
    }

    @PutMapping
    public List<FaixaHorarioResponse> substituir(@AuthenticationPrincipal Jwt jwt,
                                                 @Valid @RequestBody GradeHorarioRequest request) {
        return service.substituirGrade(UsuarioAutenticado.id(jwt), request);
    }
}
