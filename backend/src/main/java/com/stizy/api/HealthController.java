
package com.stizy.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> verificar() {
        return Map.of(
            "aplicacao", "STIZY",
            "status", "UP",
            "mensagem", "API funcionando!"
        );
    }
}