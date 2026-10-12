package com.nmt.history.repository;

import com.nmt.history.model.Role;
import com.nmt.history.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findByRoleOrderByUsernameAsc(Role role);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
