package com.parking.management.Config;

import com.parking.management.Repository.StaffRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

/**
 * Who may call what.
 *
 * Login is session based: after POST /api/auth/login the browser keeps a session cookie.
 * Requests that change data (POST/PUT/PATCH/DELETE) must also send the CSRF token from the
 * XSRF-TOKEN cookie in the X-XSRF-TOKEN header, which another website cannot read.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            StaffUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            StaffRepository staffRepository,
            SecurityContextRepository securityContextRepository) throws Exception {

        // The frontend sends the raw token from the cookie, so use the plain handler.
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null);

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(csrfHandler))
                .securityContext(context -> context
                        .securityContextRepository(securityContextRepository))
                .authorizeHttpRequests(auth -> auth
                        // Open: logging in, and fetching a CSRF token before logging in
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Admin only: staff accounts, reports and lot configuration (rates, layout)
                        .requestMatchers("/api/staff/**").hasRole("ADMIN")
                        .requestMatchers("/api/reports/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/parking-lots/**").hasRole("ADMIN")
                        // Everything else: any logged-in staff member
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().denyAll())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, ex) ->
                                SecurityErrors.write(response, HttpStatus.UNAUTHORIZED, "Please log in"))
                        .accessDeniedHandler((request, response, ex) ->
                                SecurityErrors.write(response, HttpStatus.FORBIDDEN,
                                        ex instanceof CsrfException
                                                ? "Security token missing or expired. Refresh the page and try again"
                                                : "You do not have permission to do this")))
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.OK)))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .addFilterBefore(
                        new StaffSessionFilter(staffRepository, securityContextRepository),
                        AuthorizationFilter.class);

        return http.build();
    }
}
