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

    List<User> findByRoleAndTeacherIdOrderByUsernameAsc(Role role, Long teacherId);

    List<User> findByRoleAndTeacherIdIsNull(Role role);

    long countByRole(Role role);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("select u from User u where u.role in :roles and (:q = '' or lower(u.username) like concat('%', :q, '%') or lower(coalesce(u.firstName, '')) like concat('%', :q, '%') or lower(coalesce(u.lastName, '')) like concat('%', :q, '%')) order by u.id")
    org.springframework.data.domain.Page<User> search(@org.springframework.data.repository.query.Param("roles") java.util.Collection<Role> roles, @org.springframework.data.repository.query.Param("q") String q, org.springframework.data.domain.Pageable pageable);

    long countByTeacherId(Long teacherId);
}
