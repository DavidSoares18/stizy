package com.stizy.autenticacao;

import com.stizy.usuario.Usuario;
import com.stizy.usuario.UsuarioRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AutenticacaoService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final long expiracaoMinutos;

    public AutenticacaoService(
            UsuarioRepository repository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            @Value("${stizy.jwt.issuer}") String issuer,
            @Value("${stizy.jwt.expiration-minutes}")
            long expiracaoMinutos
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.expiracaoMinutos = expiracaoMinutos;
    }

    @Transactional
    public UsuarioResponse cadastrar(CadastroRequest request) {

        String email = normalizarEmail(request.email());

        if (repository.existsByEmail(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "E-mail ja cadastrado."
            );
        }

        String senhaHash =
                passwordEncoder.encode(request.senha());

        Usuario usuario = new Usuario(
            request.nome().strip(),
            email,
            senhaHash,
            request.papel()
        );

        try {
            Usuario salvo = repository.saveAndFlush(usuario);
            return UsuarioResponse.de(salvo);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Nao foi possivel concluir o cadastro."
            );
        }
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {

        String email = normalizarEmail(request.email());
 
        Usuario usuario = repository.findByEmail(email)
                .orElseThrow(() -> credenciaisInvalidas());


        if (!passwordEncoder.matches(
                request.senha(),
                usuario.getSenhaHash()
        )) {
            throw credenciaisInvalidas();
        }

        Instant agora = Instant.now();
        Instant expiracao = agora.plus(
            expiracaoMinutos,
            ChronoUnit.MINUTES
        );

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(agora)
                .expiresAt(expiracao)
                .subject(usuario.getId().toString())
                .claim("email", usuario.getEmail())
                .claim("papel", usuario.getPapel().name())
                .build();

        JwsHeader header = JwsHeader
                .with(MacAlgorithm.HS256)
                .build();

        String token = jwtEncoder.encode(
                JwtEncoderParameters.from(header, claims)
        ).getTokenValue();

        return new TokenResponse(
            token,
            "Bearer",
            expiracaoMinutos * 60,
            UsuarioResponse.de(usuario)
        );
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarUsuario(UUID id) {

        Usuario usuario = repository.findById(id)
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario nao encontrado."
                    )
                );

        return UsuarioResponse.de(usuario);
    }

    private String normalizarEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException credenciaisInvalidas() {
        return new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Credenciais invalidas."
        );
    }
}