import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Servicio de almacenamiento para tokens y datos del usuario
 * Wrapper de AsyncStorage con manejo de errores
 */

const KEYS = {
  TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  APPEARANCE_DARK_PRESET: 'appearance_dark_preset',
  APPEARANCE_BG_MODE: 'appearance_bg_mode',
  REMEMBER_USER: 'remember_me_user',
  REMEMBER_PASS: 'remember_me_pass',
};

export const storage = {
  async set(key: string, value: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  },

  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  },

  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      // Guardar datos de "recordar usuario" antes de limpiar
      const rememberUser = await this.get(KEYS.REMEMBER_USER);
      const rememberPass = await this.get(KEYS.REMEMBER_PASS);
      
      await AsyncStorage.clear();
      
      // Restaurar datos de "recordar usuario"
      if (rememberUser) await this.set(KEYS.REMEMBER_USER, rememberUser);
      if (rememberPass) await this.set(KEYS.REMEMBER_PASS, rememberPass);
      
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },
};

/**
 * Limpia sesión y almacenamiento del cliente (p. ej. tras 401)
 */
export async function clearClientSession(): Promise<void> {
  try {
    await tokenStorage.removeToken();
    await userStorage.removeUser();
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

/**
 * Utilidad específica para manejar el token de autenticación
 */
export const tokenStorage = {
  async setToken(token: string): Promise<void> {
    await storage.set(KEYS.TOKEN, token);
  },
  
  async getToken(): Promise<string | null> {
    return await storage.get(KEYS.TOKEN);
  },
  
  async removeToken(): Promise<void> {
    await storage.remove(KEYS.TOKEN);
  },
};

/**
 * Utilidad para manejar datos del usuario
 */
export const userStorage = {
  async setUser(userData: any): Promise<void> {
    await storage.set(KEYS.USER_DATA, JSON.stringify(userData));
  },
  
  async getUser(): Promise<any | null> {
    const data = await storage.get(KEYS.USER_DATA);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  
  async removeUser(): Promise<void> {
    await storage.remove(KEYS.USER_DATA);
  },
};

export { KEYS as STORAGE_KEYS };
