package com.c4_soft.ui;

import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.ok;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.wiremock.spring.EnableWireMock;
import com.github.tomakehurst.wiremock.WireMockServer;

@EnableWireMock
@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
@AutoConfigureMockMvc
class UiBffApplicationTests {

	private static final String openidConfiguration = """
			{
			  "issuer": "%s/realms/sample",
			  "authorization_endpoint": "%s/realms/sample/protocol/openid-connect/auth",
			  "token_endpoint": "%s/realms/sample/protocol/openid-connect/token",
			  "jwks_uri": "%s/realms/sample/protocol/openid-connect/certs",
			  "subject_types_supported": [
			    "public",
			    "pairwise"
			  ]
			}
			""";

	private static final WireMockServer mockOp = new WireMockServer(options().dynamicPort());

	@DynamicPropertySource
	static void registerResourceServerIssuerProperty(DynamicPropertyRegistry registry) {
		mockOp.start();
		final var baseUrl = mockOp.baseUrl();
		registry.add("sso-issuer", () -> "%s/realms/sample".formatted(baseUrl));
		mockOp.stubFor(get("/realms/sample/.well-known/openid-configuration")
				.willReturn(ok().withHeader("Content-Type", "application/json")
						.withBody(openidConfiguration.formatted(baseUrl, baseUrl, baseUrl, baseUrl))));
	}

	@AfterAll
	static void afterAll() {
		mockOp.stop();
	}

	@Test
	void contextLoads() {
	}

}
