import { apiClient } from "./apiClient";
import type { AuthResponse, LoginRequest, RegisterRequest, KycRequest } from "../types/api";

export const authService = {
  /** POST /api/auth/login */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/login", data);
  },

  /** POST /api/auth/register */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/register", data);
  },

  /**
   * POST /api/auth/verify-kyc
   * Requires a valid JWT (user must be logged in).
   * The KycRequest includes govtIdType, govtIdNumber, docType, s3Key,
   * and consentGiven. Since no file-upload endpoint exists yet we store
   * a placeholder s3Key derived from the filename.
   */
  async verifyKyc(data: KycRequest): Promise<string> {
    return apiClient.post<string>("/auth/verify-kyc", data);
  },
};
