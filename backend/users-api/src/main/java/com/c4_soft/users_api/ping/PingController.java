package com.c4_soft.users_api.ping;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Ping")
public class PingController {

  /**
   * @return "Pong!" if the user is authenticated.
   */
  @GetMapping(path = "/ping", produces = {MediaType.APPLICATION_JSON_VALUE})
  @PreAuthorize("isAuthenticated()")
  public PingResponse ping() {
    return PingResponse.PONG;
  }

}
