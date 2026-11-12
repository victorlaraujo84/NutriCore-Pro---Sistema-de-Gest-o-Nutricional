// Client-side Google Identity Services (GIS) & Google Calendar API helper

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
    gapi?: any;
  }
}

export interface GoogleUserProfile {
  id?: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface CalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string; // ISO 8601 string
    timeZone?: string;
  };
  end: {
    dateTime: string; // ISO 8601 string
    timeZone?: string;
  };
  attendees?: Array<{ email: string; displayName?: string }>;
}

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  status?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
}

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Storage keys
const TOKEN_KEY = 'nutricore_google_access_token';
const PROFILE_KEY = 'nutricore_google_user_profile';

export class GoogleCalendarService {
  private static tokenClient: any = null;
  private static clientId: string = '';

  public static setClientId(clientId: string) {
    this.clientId = clientId;
  }

  public static getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public static getStoredProfile(): GoogleUserProfile | null {
    try {
      const data = localStorage.getItem(PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public static saveProfile(profile: GoogleUserProfile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  public static clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  }

  public static clearStoredAuth() {
    this.clearAuth();
  }

  /**
   * Fetch current authenticated user's profile info
   */
  public static async fetchUserProfile(accessToken: string): Promise<GoogleUserProfile | null> {
    if (accessToken.startsWith('demo_')) {
      const demoProfile: GoogleUserProfile = {
        id: 'demo_user_dr',
        name: 'Dra. Mariana Rios (Nutricionista)',
        email: 'mariana.nutri@clinica.com.br',
        picture: 'https://images.unsplash.com/photo-1594824813511-49fa53147d32?w=150&auto=format&fit=crop&q=80',
      };
      this.saveProfile(demoProfile);
      return demoProfile;
    }

    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const profile: GoogleUserProfile = {
        id: data.sub,
        name: data.name,
        email: data.email,
        picture: data.picture,
      };
      this.saveProfile(profile);
      return profile;
    } catch (e) {
      console.warn('Failed to fetch Google profile', e);
      return null;
    }
  }

  /**
   * Requests OAuth token using GIS popup
   */
  public static async requestGoogleAuth(clientId: string): Promise<{ token: string; profile: GoogleUserProfile | null }> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services script not loaded. Please verify internet connection.'));
        return;
      }

      if (!clientId || clientId.trim() === '') {
        reject(new Error('Client ID do Google não foi informado. Configure o Client ID ou use o modo demonstração.'));
        return;
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: async (response) => {
            if (response.error) {
              const err = new Error(response.error);
              (err as any).type = response.error;
              reject(err);
              return;
            }
            if (response.access_token) {
              this.saveToken(response.access_token);
              const profile = await this.fetchUserProfile(response.access_token);
              resolve({ token: response.access_token, profile });
            } else {
              reject(new Error('Nenhum token retornado pelo Google.'));
            }
          },
          error_callback: (err: any) => {
            const rawMsg = typeof err === 'string' ? err : (err?.message || '');
            const isPopupClosed =
              err?.type === 'popup_closed' ||
              rawMsg.toLowerCase().includes('popup window closed') ||
              rawMsg.toLowerCase().includes('popup_closed');
            const isInvalidClient =
              err?.type === 'invalid_client' ||
              rawMsg.toLowerCase().includes('invalid_client') ||
              rawMsg.includes('401');

            let friendlyMessage = rawMsg || 'Erro durante autenticação com o Google.';
            if (isInvalidClient) {
              friendlyMessage = 'Erro 401 (invalid_client): O Client ID do Google não é válido ou a URL deste app não está em Origens JavaScript autorizadas no Google Cloud Console.';
            } else if (isPopupClosed) {
              friendlyMessage = 'A janela de autenticação do Google foi fechada antes de autorizar. Se exibiu "Erro 401: invalid_client", ative o Modo Demonstração.';
            }

            const error = new Error(friendlyMessage);
            (error as any).type = err?.type || (isInvalidClient ? 'invalid_client' : (isPopupClosed ? 'popup_closed' : 'auth_error'));
            (error as any).isPopupClosed = isPopupClosed;
            (error as any).isInvalidClient = isInvalidClient;
            reject(error);
          },
        });

        client.requestAccessToken({ prompt: 'consent' });
      } catch (initErr: any) {
        reject(initErr);
      }
    });
  }

  /**
   * List events from primary Google Calendar
   */
  public static async listEvents(
    accessToken: string,
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 50
  ): Promise<CalendarEventItem[]> {
    if (accessToken.startsWith('demo_')) {
      return [];
    }

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', maxResults.toString());

    if (timeMin) {
      url.searchParams.set('timeMin', timeMin);
    } else {
      // Default: from 7 days ago to 30 days ahead
      const start = new Date();
      start.setDate(start.getDate() - 7);
      url.searchParams.set('timeMin', start.toISOString());
    }

    if (timeMax) {
      url.searchParams.set('timeMax', timeMax);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Sessão expirada. Por favor, conecte-se ao Google novamente.');
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ao listar eventos da agenda: ${errText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Create a new event in primary Google Calendar
   */
  public static async createEvent(
    accessToken: string,
    event: CalendarEventPayload
  ): Promise<CalendarEventItem> {
    if (accessToken.startsWith('demo_')) {
      return {
        id: `gcal_evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        htmlLink: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.summary)}`,
        status: 'confirmed',
        attendees: event.attendees,
      };
    }

    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Sessão expirada. Por favor, conecte-se ao Google novamente.');
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ao criar evento na agenda: ${errText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing event in primary Google Calendar
   */
  public static async updateEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEventPayload>
  ): Promise<CalendarEventItem> {
    if (accessToken.startsWith('demo_')) {
      return {
        id: eventId,
        summary: event.summary || 'Consulta Nutricional',
        description: event.description,
        location: event.location,
        start: event.start || { dateTime: new Date().toISOString() },
        end: event.end || { dateTime: new Date().toISOString() },
        htmlLink: `https://calendar.google.com/calendar`,
        status: 'confirmed',
      };
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Sessão expirada. Por favor, conecte-se ao Google novamente.');
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ao atualizar evento na agenda: ${errText}`);
    }

    return await response.json();
  }

  /**
   * Delete an event from primary Google Calendar
   */
  public static async deleteEvent(
    accessToken: string,
    eventId: string
  ): Promise<void> {
    if (accessToken.startsWith('demo_')) {
      return;
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Sessão expirada. Por favor, conecte-se ao Google novamente.');
    }

    if (!response.ok && response.status !== 404 && response.status !== 410) {
      const errText = await response.text();
      throw new Error(`Erro ao excluir evento da agenda: ${errText}`);
    }
  }
}
