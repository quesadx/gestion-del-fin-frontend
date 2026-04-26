// TODO: Implement actual API call
export const authApi = {
  verifySession: async (password: string): Promise<{ valid: boolean }> => {
    // Temporary simulation to get TypeScript to compile
    return { valid: password !== '' };
  },
};
