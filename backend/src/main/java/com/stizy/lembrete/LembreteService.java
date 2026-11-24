package com.stizy.lembrete;

import com.stizy.agendamento.Agendamento;
import com.stizy.agendamento.AgendamentoRepository;
import com.stizy.negocio.NegocioRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * EXTRA-04: lembrete por e-mail para agendamentos confirmados que começam nas próximas horas.
 * - Roda a cada stizy.lembretes.intervalo (padrão 5 min) e marca lembrete_enviado_em (V6) para não repetir.
 * - Sem SMTP configurado (spring.mail.host), só registra o e-mail no log: útil em desenvolvimento.
 * - Falha em um e-mail não impede os outros; o que falhou é tentado de novo na próxima rodada.
 */
@Service
@ConditionalOnProperty(name = "stizy.lembretes.habilitado", havingValue = "true")
public class LembreteService {

    private static final Logger log = LoggerFactory.getLogger(LembreteService.class);
    private static final DateTimeFormatter DATA_HORA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm", Locale.of("pt", "BR"));

    private final AgendamentoRepository agendamentoRepository;
    private final NegocioRepository negocioRepository;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final ZoneId fuso;
    private final Clock relogio;
    private final Duration antecedencia;
    private final String remetente;

    public LembreteService(AgendamentoRepository agendamentoRepository,
                           NegocioRepository negocioRepository,
                           ObjectProvider<JavaMailSender> mailSender,
                           ZoneId fusoDoNegocio,
                           Clock relogio,
                           @Value("${stizy.lembretes.antecedencia:PT24H}") Duration antecedencia,
                           @Value("${stizy.lembretes.remetente:nao-responda@stizy.local}") String remetente) {
        this.agendamentoRepository = agendamentoRepository;
        this.negocioRepository = negocioRepository;
        this.mailSender = mailSender;
        this.fuso = fusoDoNegocio;
        this.relogio = relogio;
        this.antecedencia = antecedencia;
        this.remetente = remetente;
    }

    @Scheduled(fixedDelayString = "${stizy.lembretes.intervalo:PT5M}", initialDelayString = "PT30S")
    public void enviarPendentes() {
        Instant agora = Instant.now(relogio);
        List<Agendamento> pendentes = agendamentoRepository.pendentesDeLembrete(agora, agora.plus(antecedencia));
        int enviados = 0;
        for (Agendamento agendamento : pendentes) {
            try {
                enviar(agendamento);
                agendamentoRepository.marcarLembreteEnviado(agendamento.getId(), Instant.now(relogio));
                enviados++;
            } catch (MailException ex) {
                log.warn("Falha ao enviar lembrete do agendamento {}: {}", agendamento.getId(), ex.getMessage());
            }
        }
        if (enviados > 0) {
            log.info("Lembretes enviados: {} de {}", enviados, pendentes.size());
        }
    }

    private void enviar(Agendamento agendamento) {
        String negocio = negocioRepository.findByProfissional_Id(agendamento.getProfissional().getId())
                .map(n -> n.getNome())
                .orElse(agendamento.getProfissional().getNome());
        String quando = agendamento.getInicio().atZone(fuso).format(DATA_HORA);

        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(agendamento.getCliente().getEmail());
        mensagem.setSubject("Lembrete STIZY: " + agendamento.getServico().getNome() + " em " + quando);
        mensagem.setText(String.format("""
                Olá, %s!

                Lembrete do seu agendamento:
                  Serviço: %s
                  Local: %s
                  Data: %s
                  Valor: R$ %s (pagamento no local)

                Se não puder comparecer, cancele ou remarque pelo STIZY.

                STIZY — Seu horário, sem complicação.
                """,
                agendamento.getCliente().getNome(), agendamento.getServico().getNome(), negocio, quando,
                agendamento.getPreco().toPlainString().replace('.', ',')));

        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("[lembrete sem SMTP] Para: {} | {}\n{}", mensagem.getTo()[0], mensagem.getSubject(),
                    mensagem.getText());
            return;
        }
        sender.send(mensagem);
    }
}
