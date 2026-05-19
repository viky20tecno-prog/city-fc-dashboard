export function useRole() {
  const role = localStorage.getItem('userRole') || 'ADMIN';

  return {
    role,
    isAdmin:      role === 'ADMIN',
    isEntrenador: role === 'ENTRENADOR',
    canViewFinancial: role === 'ADMIN',
    canEditFinancial: role === 'ADMIN',
    canManageMembers: role === 'ADMIN',
    canViewPlayers:   true,
    canEditPlayers:   true,
    canViewArbitraje: true,
    canViewUniforms:  true,
  };
}
