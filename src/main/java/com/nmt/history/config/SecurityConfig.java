package com.nmt.history.config;

import com.nmt.history.model.Role;
import com.nmt.history.security.JwtAuthenticationFilter;
import com.nmt.history.security.JwtUtils;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String STUDENT = Role.STUDENT.name();
    private static final String TEACHER = Role.TEACHER.name();
    private static final String ADMIN = Role.ADMIN.name();

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtUtils jwtUtils,
                                                   UserDetailsService userDetailsService) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/health", "/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/subscription/plans").permitAll()
                        .requestMatchers("/api/admin/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/subjects").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/tests", "/api/tests/*", "/api/tests/questions/*/image", "/api/tests/options/*/image").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/quizlet", "/api/quizlet/**").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/tests/*/start", "/api/tests/*/leave", "/api/tests/*/submit", "/api/tests/*/questions/*/check", "/api/tests/*/questions/*/explanation").hasAnyRole(STUDENT, TEACHER)
                        .requestMatchers("/api/practice/**").hasAnyRole(STUDENT, TEACHER)
                        .requestMatchers(HttpMethod.GET, "/api/results/my", "/api/results/my/topics").hasAnyRole(STUDENT, TEACHER)

                        .requestMatchers(HttpMethod.GET, "/api/results/*").hasAnyRole(STUDENT, TEACHER)

                        .requestMatchers(HttpMethod.POST, "/api/tests/create", "/api/tests/questions/create").hasAnyRole(TEACHER, ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/quizlet/**").hasAnyRole(TEACHER, ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/tests/**", "/api/quizlet/**").hasAnyRole(TEACHER, ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/tests/**", "/api/quizlet/**").hasAnyRole(TEACHER, ADMIN)
                        .requestMatchers("/api/teacher/**").hasAnyRole(TEACHER, ADMIN)

                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthenticationFilter(jwtUtils, userDetailsService),
                        UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") List<String> allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
