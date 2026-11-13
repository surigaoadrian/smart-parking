package com.parking.management.Controller;

import com.parking.management.DTO.ChangePasswordRequest;
import com.parking.management.DTO.LoginRequest;
import com.parking.management.DTO.StaffResponse;
import com.parking.management.Enums.StaffRole;
import com.parking.management.Exceptions.ForbiddenException;
import com.parking.management.Exceptions.UnauthorizedException;
import com.parking.management.Service.StaffService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final StaffService staffService;

    public AuthController(
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            StaffService staffService) {

        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.staffService = staffService;
    }

    /** Hands out a CSRF token (as the XSRF-TOKEN cookie) before the first login. */
    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("headerName", token.getHeaderName());
    }

    @PostMapping("/login")
    public StaffResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            StaffService.normalizeUsername(request.username()),
                            request.password()));
        } catch (DisabledException ex) {
            throw new UnauthorizedException("This account is deactivated. Contact an admin");
        } catch (AuthenticationException ex) {
            // Same message for wrong username and wrong password, so usernames can't be guessed.
            throw new UnauthorizedException("Invalid username or password");
        }

        // Admins sign in at /admin, attendants at /login. Checked before any session is created.
        if (request.portal() != null) {
            String requiredRole = "ROLE_" + request.portal().name();
            boolean matches = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals(requiredRole));

            if (!matches) {
                throw new ForbiddenException(request.portal() == StaffRole.ADMIN
                        ? "This is an attendant account. Please sign in at the staff login (/login)"
                        : "This is an admin account. Please sign in at the admin login (/admin)");
            }
        }

        // New session id after login (prevents session fixation), then store the login in it.
        if (httpRequest.getSession(false) != null) {
            httpRequest.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        return StaffResponse.from(staffService.getCurrentStaff());
    }

    /** Who is logged in. 401 when nobody is, which the frontend uses to show the login page. */
    @GetMapping("/me")
    public StaffResponse me() {
        return StaffResponse.from(staffService.getCurrentStaff());
    }

    @PostMapping("/password")
    public Map<String, String> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {

        staffService.changeOwnPassword(
                staffService.getCurrentStaff(),
                request.currentPassword(),
                request.newPassword());

        return Map.of("message", "Password changed");
    }

    // POST /api/auth/logout is handled by Spring Security (see SecurityConfig).
}
