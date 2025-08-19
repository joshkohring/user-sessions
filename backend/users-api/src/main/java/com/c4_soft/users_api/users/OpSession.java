package com.c4_soft.users_api.users;

/**
 * @param start the time when the user started the SSO session (epoch seconds)
 * @param idle the time when the user session will be invalidated if a client does not interact
 *        with the OP on his behalf (epoch seconds)
 * @param max the time when the user session will be invalidated, even if if he keeps interacting
 *        with the OP (epoch seconds)
 */
public record OpSession(long start, long idle, long max) {
}