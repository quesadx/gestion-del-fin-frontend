export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthUser {
  username: string;
  sessionExpires: string;
}

const sleep = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const authService = {
  login: async ({ username, password }: LoginPayload): Promise<AuthUser> => {
    await sleep(900);

    if (!username.trim() || !password.trim()) {
      throw new Error('Por favor ingresa usuario y contraseña.');
    }

    return {
      username: username.trim().toUpperCase(),
      sessionExpires: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    };
  },

  logout: async (): Promise<void> => {
    await sleep(300);
  },
};
