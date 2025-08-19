package com.c4_soft.users_api.ping;

/**
 * @param message
 */
public record PingResponse(String message) {
  public static final PingResponse PONG = new PingResponse("Pong!");
}
