package com.parking.management.Config;

import com.parking.management.Entity.Staff;
import com.parking.management.Repository.StaffRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Re-checks the logged-in account on every request, so admin changes apply immediately:
 * - a deactivated account is logged out on its next request
 * - a role change (attendant to admin or back) takes effect without logging in again
 *
 * Not a Spring bean on purpose: it is added only to the security filter chain.
 */
public class StaffSessionFilter extends OncePerRequestFilter {
    private static final String ROLE_PREFIX = "ROLE_";

    private final StaffRepository staffRepository;
    private final SecurityContextRepository securityContextRepository;

    public StaffSessionFilter(
            StaffRepository staffRepository,
            SecurityContextRepository securityContextRepository) {

        this.staffRepository = staffRepository;
        this.securityContextRepository = securityContextRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            chain.doFilter(request, response);
            return;
        }

        Optional<Staff> staff = staffRepository.findByUsername(auth.getName());

        if (staff.isEmpty() || !staff.get().isActive()) {
            SecurityContextHolder.clearContext();
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            SecurityErrors.write(response, HttpStatus.UNAUTHORIZED,
                    "Your account has been deactivated. Contact an admin");
            return;
        }

        String currentRole = ROLE_PREFIX + staff.get().getRole().name();
        List<String> sessionRoles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith(ROLE_PREFIX))
                .toList();

        if (!sessionRoles.equals(List.of(currentRole))) {
            // Keep any non-role authorities, swap the role for the one in the database.
            List<GrantedAuthority> authorities = new ArrayList<>();
            auth.getAuthorities().stream()
                    .filter(a -> !a.getAuthority().startsWith(ROLE_PREFIX))
                    .forEach(authorities::add);
            authorities.add(new SimpleGrantedAuthority(currentRole));

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                    auth.getPrincipal(), null, authorities));
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);
        }

        chain.doFilter(request, response);
    }
}
