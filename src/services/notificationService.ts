import { apiClient } from "./apiClient";
import type { RegistrationOpenNotificationRequest } from "../types/api";

export const notificationService = {
  /**
   * POST /api/notifications/tournament/{id}/open
   * Stores channel enablements in the DB and dispatches email/push/SMS
   * notifications to all community users of this tournament.
   */
  async sendRegistrationOpenNotification(
    tournamentId: number,
    config: RegistrationOpenNotificationRequest
  ): Promise<void> {
    return apiClient.post<void>(`/notifications/tournament/${tournamentId}/open`, config);
  },
};
