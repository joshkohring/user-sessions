package com.c4_soft.ui;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@RestController
@Tag(name = "UiBffSessions",
    description = "Provides information about the current user session on the BFF")
@RequiredArgsConstructor
public class SessionInfoController {

  private final OAuth2AuthorizedClientRepository authorizedClientRepository;
  private final ObjectMapper objectMapper;

  @GetMapping(path = "/session-info", produces = {MediaType.APPLICATION_JSON_VALUE})
  public SessionInfo getSessionInfo(Authentication authentication) {
    final var attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
    final var session = attr.getRequest().getSession(false);
    final var sessionId = session == null ? null : session.getId();
    if (authentication instanceof OAuth2AuthenticationToken oauth) {
      final var authorizedClient = authorizedClientRepository
          .loadAuthorizedClient(oauth.getAuthorizedClientRegistrationId(), oauth, null);

      final var accessExp =
          getExp(authorizedClient == null || authorizedClient.getAccessToken() == null ? null
              : authorizedClient.getAccessToken().getTokenValue());

      final var refreshExp =
          getExp(authorizedClient == null || authorizedClient.getRefreshToken() == null ? null
              : authorizedClient.getRefreshToken().getTokenValue());

      return new SessionInfo(oauth.getName(), sessionId, refreshExp, getLastAccessed(session),
          getExp(session), accessExp);
    }

    return new SessionInfo("", sessionId, null, getLastAccessed(session), getExp(session), null);
  }

  private Map<String, Object> getClaims(String jwt) {
    if (jwt == null) {
      return Map.of();
    }
    final var chunks = jwt.split("\\.");
    if (chunks.length != 3) {
      return Map.of();
    }
    final var decodedBody = Base64.getDecoder().decode(chunks[1]);
    try {
      return (Map<String, Object>) objectMapper.readValue(decodedBody, Map.class);
    } catch (IOException e) {
      return Map.of();
    }
  }

  private Integer getExp(String tokenValue) {
    final var claims = getClaims(tokenValue);

    return claims == null ? null : (Integer) claims.get(JwtClaimNames.EXP);
  }

  private Integer getExp(HttpSession session) {
    return session == null ? null : getLastAccessed(session) + session.getMaxInactiveInterval();
  }

  private Integer getLastAccessed(HttpSession session) {
    return session == null ? null : Math.round(session.getLastAccessedTime() / 1000L);
  }

  public static record SessionInfo(@NotNull String name, String sessionId, Integer userSessionExp,
      Integer bffSessionLastAccessed, Integer bffSessionExp, Integer accessTokenExp) {
  }
}
